import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Switch, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initPushNotifications, checkAndScheduleChallengeNotification, checkAndScheduleDailyMissionNotification } from '../../services/notificationService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

interface NotificationSettings {
  challengeEnabled: boolean;
  challengeTime: string;
  dailyEnabled: boolean;
  dailyTime: string;
}

interface Props {
  navigation: NativeStackScreenProps<RootStackParamList, 'NotificationsPush'>['navigation'];
}

const NotificationsPushScreen: React.FC<Props> = ({ navigation }) => {
  // Initialize with 9:00 AM as default time
  const defaultTime = new Date();
  defaultTime.setHours(9, 0, 0, 0);

  const [isChallengeEnabled, setIsChallengeEnabled] = useState(false);
  const [isDailyEnabled, setIsDailyEnabled] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [showDailyPicker, setShowDailyPicker] = useState(false);
  const [challengeTime, setChallengeTime] = useState(defaultTime);
  const [dailyTime, setDailyTime] = useState(defaultTime);
  const [tempChallengeTime, setTempChallengeTime] = useState(defaultTime);
  const [tempDailyTime, setTempDailyTime] = useState(defaultTime);

  useEffect(() => {
    loadSettings();
    initPushNotifications();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settings) {
        const { challengeEnabled, challengeTime, dailyEnabled, dailyTime } = JSON.parse(settings);
        setIsChallengeEnabled(challengeEnabled);
        setChallengeTime(challengeTime ? new Date(challengeTime) : defaultTime);
        setTempChallengeTime(challengeTime ? new Date(challengeTime) : defaultTime);
        setIsDailyEnabled(dailyEnabled);
        setDailyTime(dailyTime ? new Date(dailyTime) : defaultTime);
        setTempDailyTime(dailyTime ? new Date(dailyTime) : defaultTime);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // If there's an error, reset to default time
      setChallengeTime(defaultTime);
      setDailyTime(defaultTime);
      setTempChallengeTime(defaultTime);
      setTempDailyTime(defaultTime);
    }
  };

  const saveSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      const currentSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      const parsedSettings = currentSettings ? JSON.parse(currentSettings) : {
        challengeEnabled: false,
        challengeTime: defaultTime.toISOString(),
        dailyEnabled: false,
        dailyTime: defaultTime.toISOString(),
      };
      
      const newSettings = { ...parsedSettings, ...settings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      
      // Schedule or cancel notifications based on new settings
      if (newSettings.challengeEnabled) {
        await checkAndScheduleChallengeNotification();
      }
      if (newSettings.dailyEnabled) {
        await checkAndScheduleDailyMissionNotification();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const onChallengeToggle = async () => {
    const newValue = !isChallengeEnabled;
    setIsChallengeEnabled(newValue);
    await saveSettings({ 
      challengeEnabled: newValue,
      challengeTime: challengeTime.toISOString()
    });
  };

  const onDailyToggle = async () => {
    const newValue = !isDailyEnabled;
    setIsDailyEnabled(newValue);
    await saveSettings({ 
      dailyEnabled: newValue,
      dailyTime: dailyTime.toISOString()
    });
  };

  const handleChallengeTimeChange = (event: any, selectedTime: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowChallengePicker(false);
    }
    if (selectedTime) {
      setTempChallengeTime(selectedTime);
    }
  };

  const handleDailyTimeChange = (event: any, selectedTime: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDailyPicker(false);
    }
    if (selectedTime) {
      setTempDailyTime(selectedTime);
    }
  };

  const handleChallengeDone = async () => {
    setShowChallengePicker(false);
    setChallengeTime(tempChallengeTime);
    await saveSettings({ challengeTime: tempChallengeTime.toISOString() });
  };

  const handleDailyDone = async () => {
    setShowDailyPicker(false);
    setDailyTime(tempDailyTime);
    await saveSettings({ dailyTime: tempDailyTime.toISOString() });
  };

  const handleChallengeCancel = () => {
    setShowChallengePicker(false);
    setTempChallengeTime(challengeTime);
  };

  const handleDailyCancel = () => {
    setShowDailyPicker(false);
    setTempDailyTime(dailyTime);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const NotificationItem = ({ 
    title, 
    description, 
    enabled, 
    onToggle, 
    time, 
    onTimePress 
  }: { 
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    time: Date;
    onTimePress: () => void;
  }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#2A2A2A', true: '#FFD700' }}
          thumbColor={enabled ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>
      <Text style={styles.notificationDescription}>{description}</Text>
      {enabled && (
        <TouchableOpacity 
          style={styles.timeSelector}
          onPress={onTimePress}
        >
          <Text style={styles.timeText}>
            Notification time: {formatTime(time)}
          </Text>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#FFD700" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Push Notifications</Text>
      </View>

      <View style={styles.content}>
        <NotificationItem
          title="Challenge Tracking"
          description="Stay on track with reminders so you don't miss any new training sessions."
          enabled={isChallengeEnabled}
          onToggle={onChallengeToggle}
          time={challengeTime}
          onTimePress={() => setShowChallengePicker(true)}
        />

        <NotificationItem
          title="Daily Missions"
          description="Get reminded to complete your daily missions and maintain your streak."
          enabled={isDailyEnabled}
          onToggle={onDailyToggle}
          time={dailyTime}
          onTimePress={() => setShowDailyPicker(true)}
        />
      </View>

      {showChallengePicker && Platform.OS === 'ios' && (
        <View style={styles.timePickerContainer}>
          <View style={styles.timePickerHeader}>
            <TouchableOpacity onPress={handleChallengeCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChallengeDone}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempChallengeTime}
            mode="time"
            display="spinner"
            onChange={handleChallengeTimeChange}
            textColor="#000000"
            style={{ backgroundColor: '#DADADA' }}
          />
        </View>
      )}

      {showDailyPicker && Platform.OS === 'ios' && (
        <View style={styles.timePickerContainer}>
          <View style={styles.timePickerHeader}>
            <TouchableOpacity onPress={handleDailyCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDailyDone}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDailyTime}
            mode="time"
            display="spinner"
            onChange={handleDailyTimeChange}
            textColor="#000000"
            style={{ backgroundColor: '#DADADA' }}
          />
        </View>
      )}

      {showChallengePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempChallengeTime}
          mode="time"
          onChange={handleChallengeTimeChange}
        />
      )}

      {showDailyPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDailyTime}
          mode="time"
          onChange={handleDailyTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  timeText: {
    color: '#FFD700',
    fontSize: 14,
  },
  timePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DADADA',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  doneButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotificationsPushScreen;