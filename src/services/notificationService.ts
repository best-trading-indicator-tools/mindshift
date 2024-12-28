import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  type: 'success' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = '@notifications';

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