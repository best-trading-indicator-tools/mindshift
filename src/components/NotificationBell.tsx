import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEffect, useRef } from 'react';

interface NotificationBellProps {
  hasNotifications?: boolean;
  onPress?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  hasNotifications = false,
  onPress 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (hasNotifications) {
      // Create the animation sequence
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      
      // Start the animation
      animationRef.current.start();
    } else {
      // Reset the animation value when there are no notifications
      pulseAnim.setValue(1);
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [hasNotifications, pulseAnim]);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="bell-outline"
        size={24}
        color="#fff"
        onPress={onPress}
      />
      {hasNotifications && (
        <Animated.View
          style={[
            styles.notificationDot,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
});

export default NotificationBell;
