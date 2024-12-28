import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isExerciseCompletedToday } from '../services/exerciseService';

const NotificationBell: React.FC = () => {
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    checkNotifications();
  }, []);

  const checkNotifications = async () => {
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
      
      // Show notification dot if either:
      // 1. There are incomplete missions
      // 2. All missions are completed (to show congratulations)
      setHasNotifications(completedCount < totalMissions || completedCount === totalMissions);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="bell" size={24} color="#FFFFFF" />
      {hasNotifications && <View style={styles.notificationDot} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    borderWidth: 1,
    borderColor: '#121212',
  },
});

export default NotificationBell;
