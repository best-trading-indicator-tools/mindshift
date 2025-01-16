import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Switch } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationsPush'>;

const NotificationsPushScreen: React.FC<Props> = ({ navigation }) => {
  const [dailyInspiration, setDailyInspiration] = useState(false);
  const [challengeTracking, setChallengeTracking] = useState(false);
  const [contentExploration, setContentExploration] = useState(false);

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
      onValueChange: setChallengeTracking,
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
          </View>
        ))}
      </View>
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
    fontWeight: '500',
    color: '#FFFFFF',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});

export default NotificationsPushScreen; 