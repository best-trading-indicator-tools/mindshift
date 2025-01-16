import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Text } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Switch } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationsPush'>;
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

const NotificationsPushScreen: React.FC<Props> = ({ navigation }) => {
  const [dailyInspiration, setDailyInspiration] = useState(false);
  const [challengeTracking, setChallengeTracking] = useState(false);
  const [contentExploration, setContentExploration] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [tempTime, setTempTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setChallengeTracking(parsed.enabled);
        const savedTime = new Date(parsed.notificationTime);
        setNotificationTime(savedTime);
        setTempTime(savedTime);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (enabled: boolean, time: Date) => {
    try {
      const settings = {
        enabled,
        notificationTime: time.toISOString(),
      };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (selectedDate) {
        setNotificationTime(selectedDate);
        setTempTime(selectedDate);
        saveSettings(challengeTracking, selectedDate);
      }
    } else if (selectedDate) {
      setTempTime(selectedDate);
    }
  };

  const handleDone = () => {
    setShowTimePicker(false);
    setNotificationTime(tempTime);
    saveSettings(challengeTracking, tempTime);
  };

  const handleCancel = () => {
    setShowTimePicker(false);
    setTempTime(notificationTime);
  };

  const handleChallengeTrackingChange = (value: boolean) => {
    setChallengeTracking(value);
    saveSettings(value, notificationTime);
  };

  const notifications = [
    {
      title: 'Daily Inspiration',
      description: 'A daily reminder encouraging you to return and take care of your voice.',
      value: dailyInspiration,
      onValueChange: setDailyInspiration,
    },
    {
      title: 'Challenge Tracking',
      description: 'Stay on track with reminders so you don\'t miss any new training sessions.',
      value: challengeTracking,
      onValueChange: handleChallengeTrackingChange,
      showTime: true,
    },
    {
      title: 'Content Exploration',
      description: 'Be the first to discover the latest updates, including new challenges, training sessions, tests, podcasts, videos, discussions, and conferences in the app.',
      value: contentExploration,
      onValueChange: setContentExploration,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Push Notifications</Text>
      </View>

      <View style={styles.content}>
        {notifications.map((item, index) => (
          <View key={index} style={styles.notificationItem}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Switch
                value={item.value}
                onValueChange={item.onValueChange}
                trackColor={{ false: '#2A2A2A', true: '#FFD700' }}
                thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
            <Text style={styles.notificationDescription}>{item.description}</Text>
            
            {item.showTime && item.value && (
              <TouchableOpacity 
                style={styles.timeSelector}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeText}>
                  Notification time: {notificationTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
                <MaterialCommunityIcons name="clock-outline" size={24} color="#FFD700" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {showTimePicker && Platform.OS === 'ios' && (
        <View style={styles.timePickerContainer}>
          <View style={styles.timePickerHeader}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleTimeChange}
            textColor="black"
            style={styles.timePicker}
          />
        </View>
      )}

      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
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
    color: '#888888',
    fontSize: 16,
  },
  doneButton: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timePicker: {
    height: 200,
    backgroundColor: '#DADADA',
  },
});

export default NotificationsPushScreen;