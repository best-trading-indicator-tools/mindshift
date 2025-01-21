import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  duration?: number;
}

const LoadingProgressBar: React.FC<Props> = ({
  width = 200,
  height = 4,
  color = '#4CAF50',
  backgroundColor = '#2A2A2A',
  duration = 1500,
}) => {
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [duration, progressAnim]);

  return (
    <View style={[styles.container, { width, height, backgroundColor }]}>
      <Animated.View
        style={[
          styles.progress,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            height,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 2,
  },
});

export default LoadingProgressBar;
