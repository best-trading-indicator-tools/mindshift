import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';
import { getNotifications } from '../services/notificationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList & RootTabParamList>;

export const NotificationBell: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [hasUnread, setHasUnread] = useState(false);

  const checkNotifications = async () => {
    const notifications = await getNotifications();
    setHasUnread(notifications.some(notification => !notification.isRead));
  };

  useEffect(() => {
    checkNotifications();
    
    // Check for new notifications every second (more frequent than before)
    const interval = setInterval(checkNotifications, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => navigation.navigate('Notifications')}
    >
      <MaterialCommunityIcons 
        name="bell-outline" 
        size={24} 
        color="#FFFFFF" 
      />
      {hasUnread && <View style={styles.badge} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
});
