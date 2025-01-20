import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import { getChallengeProgress } from '../utils/exerciseCompletion';

export interface Notification {
  id: string;
  type: 'success' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = '@notifications';
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const CHALLENGE_COMPLETION_KEY_PREFIX = '@challenge_exercise_completion:';
const DAILY_COMPLETION_KEY_PREFIX = '@daily_exercise_completion:';

// Initialize push notifications
export const initPushNotifications = () => {
  PushNotification.configure({
    onNotification: async function (notification: any) {
      console.log('NOTIFICATION:', notification);

      // Add in-app notification when push notification is received
      if (notification.data?.type === 'daily' || notification.data?.type === 'challenge') {
        await addNotification({
          id: `${notification.data.type}-${Date.now()}`,
          type: 'reminder',
          title: notification.title || 'Time for Your Daily Mission! 🎯',
          message: notification.message || "Don't forget to complete your daily mission and maintain your streak!",
        });
      }

      // Required on iOS only
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    },
    // IOS ONLY
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  if (Platform.OS === 'android') {
    // Create the notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'challenge-reminders',
        channelName: 'Challenge Reminders',
        channelDescription: 'Reminders for challenge exercises',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created: boolean) => console.log(`Channel 'challenge-reminders' created: ${created}`)
    );
  }
};

const scheduleNotification = async (
  type: 'challenge' | 'daily',
  time: Date,
  title: string,
  message: string
) => {
  try {
    // Create a new date for tomorrow at the specified time
    const scheduledTime = new Date();
    scheduledTime.setDate(scheduledTime.getDate() + 1); // tomorrow
    scheduledTime.setHours(time.getHours());
    scheduledTime.setMinutes(time.getMinutes());
    scheduledTime.setSeconds(0);
    scheduledTime.setMilliseconds(0);

    // Cancel existing notifications of this type
    if (Platform.OS === 'ios') {
      PushNotificationIOS.getPendingNotificationRequests((requests) => {
        const existingIds = requests
          .filter((req: { id: string }) => req.id.startsWith(type))
          .map((req: { id: string }) => req.id);
        existingIds.forEach((id: string) => {
          PushNotificationIOS.removePendingNotificationRequests([id]);
        });
      });
    } else {
      PushNotification.cancelAllLocalNotifications();
    }

    // Schedule new notification
    if (Platform.OS === 'ios') {
      PushNotificationIOS.addNotificationRequest({
        id: `${type}-reminder-${Date.now()}`,
        title,
        body: message,
        fireDate: scheduledTime,
        userInfo: { type }
      });
    } else {
      PushNotification.localNotificationSchedule({
        channelId: 'challenge-reminders',
        title,
        message,
        date: scheduledTime,
        allowWhileIdle: true,
        userInfo: { type }
      });
    }

    // Add in-app notification for scheduling confirmation
    await addNotification({
      id: `${type}-reminder-${Date.now()}`,
      type: 'reminder',
      title,
      message: `Reminder scheduled for ${scheduledTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
    });

  } catch (error) {
    console.error(`Error scheduling ${type} notification:`, error);
    throw error;
  }
};

export const checkAndScheduleDailyMissionNotification = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!settingsJson) return;
    
    const settings = JSON.parse(settingsJson);
    if (!settings.dailyEnabled || !settings.dailyTime) return;

    const today = new Date().toISOString().split('T')[0];
    const allKeys = await AsyncStorage.getAllKeys();
    const dailyKeys = allKeys.filter(key => key.startsWith(DAILY_COMPLETION_KEY_PREFIX));
    
    const completions = await Promise.all(
      dailyKeys.map(async key => {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      })
    );

    const didExerciseToday = completions.some(
      completion => completion && completion.completedAt.startsWith(today)
    );
    if (didExerciseToday) return;

    const storedMissions = await AsyncStorage.getItem('selectedDailyMissions');
    if (!storedMissions) return;
    
    const missions = JSON.parse(storedMissions);
    if (!missions.length) return;

    await scheduleNotification(
      'daily',
      new Date(settings.dailyTime),
      "Time for Your Daily Missions! 🎯",
      `You haven't completed any daily missions today. Take a moment to maintain your mindfulness practice!`
    );

  } catch (error) {
    console.error('Error scheduling daily mission notification:', error);
    throw error;
  }
};

export const checkAndScheduleChallengeNotification = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!settingsJson) return;
    
    const settings = JSON.parse(settingsJson);
    if (!settings.challengeEnabled || !settings.challengeTime) return;

    const today = new Date().toISOString().split('T')[0];
    const allKeys = await AsyncStorage.getAllKeys();
    const challengeKeys = allKeys.filter(key => key.startsWith(CHALLENGE_COMPLETION_KEY_PREFIX));
    
    const completions = await Promise.all(
      challengeKeys.map(async key => {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      })
    );

    const didExerciseToday = completions.some(
      completion => completion && completion.completedAt.startsWith(today)
    );
    if (didExerciseToday) return;

    await scheduleNotification(
      'challenge',
      new Date(settings.challengeTime),
      "Time for Your Challenge! 💪",
      `You haven't completed any challenge exercises today. Keep up your progress!`
    );

  } catch (error) {
    console.error('Error scheduling challenge notification:', error);
    throw error;
  }
};

export const addNotification = async (notification: Omit<Notification, 'timestamp' | 'isRead'>) => {
  try {
    const existingNotifications = await getNotifications();
    const newNotification: Notification = {
      ...notification,
      timestamp: new Date(),
      isRead: false,
    };
    
    const updatedNotifications = [newNotification, ...existingNotifications];
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    return true;
  } catch (error) {
    console.error('Error adding notification:', error);
    return false;
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!notificationsJson) return [];
    
    const notifications = JSON.parse(notificationsJson);
    return notifications.map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

export const clearNotifications = async () => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
}; 