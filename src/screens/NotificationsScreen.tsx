import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const notifications = [
  {
    id: '1',
    title: 'Challenge Incomplete!',
    message: "Don't let one missed day discourage you. Keep pushing forward to reach your goals.",
    icon: 'flag-variant',
    color: '#6366f1',
    time: '2h ago'
  },
  {
    id: '2',
    title: 'Outstanding Progress!',
    message: "You did it! It wasn't easy, but you've completed today's mindfulness session.",
    icon: 'star',
    color: '#FFD700',
    time: '5h ago'
  },
  {
    id: '3',
    title: 'Mindfulness Master',
    message: "You've completed your first meditation session! This is just the beginning of your journey to inner peace.",
    icon: 'meditation',
    color: '#4CAF50',
    time: '1d ago'
  },
  {
    id: '4',
    title: 'Digital Wellness Achievement',
    message: "Training will help you manage stress, improve focus, and build resilience. Keep up the great work!",
    icon: 'trophy',
    color: '#6366f1',
    time: '2d ago'
  }
];

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            type="material-community"
            name="close"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.notificationsList}>
        {notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationDot} />
            <View style={styles.iconContainer}>
              <Icon
                type="material-community"
                name={notification.icon}
                size={24}
                color={notification.color}
              />
            </View>
            <View style={styles.contentContainer}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.timeText}>{notification.time}</Text>
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationsList: {
    flex: 1,
    padding: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 20,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
  },
});

export default NotificationsScreen;
