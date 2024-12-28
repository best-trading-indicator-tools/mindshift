import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isExerciseCompletedToday } from '../services/exerciseService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'success';
  timestamp: Date;
}

const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    checkDailyMissions();
  }, []);

  const checkDailyMissions = async () => {
    try {
      const results = await Promise.all([
        isExerciseCompletedToday('deep-breathing'),
        isExerciseCompletedToday('active-incantations'),
        isExerciseCompletedToday('passive-incantations'),
        isExerciseCompletedToday('voix-nasale'),
        isExerciseCompletedToday('fry-vocal'),
      ]);

      const completedCount = results.filter(Boolean).length;
      const totalMissions = 5;
      const remainingMissions = totalMissions - completedCount;

      let newNotifications: Notification[] = [];

      if (remainingMissions > 0) {
        newNotifications.push({
          id: 'daily-reminder',
          title: 'Missed Day Challenge',
          message: `A gentle reminder that you still have ${remainingMissions} mission${remainingMissions > 1 ? 's' : ''} to complete today. It's not too late to catch up!`,
          type: 'reminder',
          timestamp: new Date(),
        });
      }

      if (completedCount === totalMissions) {
        newNotifications.push({
          id: 'completion',
          title: 'Outstanding!',
          message: "You've completed all your daily missions! Keep up the great work to maintain your streak.",
          type: 'success',
          timestamp: new Date(),
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error checking missions:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notificationsList}>
        {notifications.map((notification) => (
          <View 
            key={notification.id} 
            style={[
              styles.notificationCard,
              notification.type === 'success' && styles.successCard
            ]}
          >
            <View style={styles.notificationIcon}>
              <MaterialCommunityIcons 
                name={notification.type === 'success' ? 'trophy' : 'run'}
                size={24} 
                color={notification.type === 'success' ? '#FFD700' : '#FFFFFF'} 
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3744',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  notificationsList: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successCard: {
    backgroundColor: '#1a1f3d',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
