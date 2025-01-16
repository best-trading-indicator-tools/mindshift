import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isExerciseCompletedToday } from '../../services/exerciseService';
import { Notification, getNotifications, markNotificationAsRead } from '../../services/notificationService';

const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const notifs = await getNotifications();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filteredNotifs = notifs
        .filter(n => new Date(n.timestamp) >= today)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(filteredNotifs);
      setHasUnread(filteredNotifs.some(n => !n.isRead));
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert(
        'Error',
        'Unable to load notifications. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      loadNotifications();
    }
  }, [loadNotifications]);

  const renderNotification = useCallback(({ id, type, title, message, timestamp, isRead }: Notification) => (
    <TouchableOpacity 
      key={id} 
      style={[
        styles.notificationCard,
        type === 'success' && styles.successCard,
        isRead && styles.readCard
      ]}
      onPress={() => handleNotificationPress({ id, type, title, message, timestamp, isRead })}
    >
      <View style={styles.notificationIcon}>
        <MaterialCommunityIcons 
          name={type === 'success' ? 'trophy' : 'bell-ring'}
          size={24} 
          color={type === 'success' ? '#FFD700' : '#FFFFFF'} 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, isRead && styles.readText]}>{title}</Text>
        <Text style={[styles.notificationMessage, isRead && styles.readText]}>{message}</Text>
        <Text style={styles.notificationTime}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  ), [handleNotificationPress]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="loading" size={48} color="#666666" />
            <Text style={styles.emptyStateText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off" size={48} color="#666666" />
            <Text style={styles.emptyStateText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map(renderNotification)
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3744',
    position: 'relative',
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 20,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyStateText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 16,
  },
  notificationCard: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  successCard: {
    backgroundColor: '#1a1f3d',
  },
  readCard: {
    opacity: 0.7,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  notificationTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  readText: {
    opacity: 0.7,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
