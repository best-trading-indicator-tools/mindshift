import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveIncantationsExercise'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCROLL_DURATION = 5000; // 5 seconds per incantation

const ActiveIncantationsExerciseScreen: React.FC<Props> = ({ route, navigation }) => {
  const { incantations } = route.params;
  const [isPaused, setIsPaused] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isPaused && currentIndex < incantations.length) {
      const animation = Animated.timing(scrollY, {
        toValue: (currentIndex + 1) * SCREEN_HEIGHT,
        duration: SCROLL_DURATION,
        useNativeDriver: true,
      });

      animation.start(({ finished }) => {
        if (finished) {
          setCurrentIndex(prev => prev + 1);
        }
      });

      return () => animation.stop();
    }
  }, [currentIndex, isPaused]);

  const togglePause = () => setIsPaused(!isPaused);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1} 
      onPress={togglePause}
    >
      <Animated.View
        style={[
          styles.scrollContainer,
          {
            transform: [{ translateY: scrollY.interpolate({
              inputRange: [0, SCREEN_HEIGHT * incantations.length],
              outputRange: [0, -SCREEN_HEIGHT * incantations.length],
            })}],
          },
        ]}
      >
        {incantations.map((incantation, index) => (
          <View key={index} style={styles.incantationContainer}>
            <Text style={styles.incantationText}>{incantation}</Text>
          </View>
        ))}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  incantationContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  incantationText: {
    color: '#FFFFFF',
    fontSize: 32,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ActiveIncantationsExerciseScreen; 