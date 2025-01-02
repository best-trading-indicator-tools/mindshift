import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import SunBreathAnimation from '../../components/sun-breath/SunBreathAnimation';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathExercise'>;

const { width, height } = Dimensions.get('window');

const INHALE_DURATION = 4000; // 4 seconds
const HOLD_DURATION = 1000; // 1 second
const EXHALE_DURATION = 6000; // 6 seconds
const CYCLES = 5;

const SunBreathExerciseScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isInhaling, setIsInhaling] = useState(true);
  const [instruction, setInstruction] = useState('Breathe In');
  
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startBreathingCycle = () => {
    // Inhale
    setIsInhaling(true);
    setInstruction('Breathe In');
    progress.value = withSequence(
      withTiming(1, { duration: INHALE_DURATION }),
      withTiming(1, { duration: HOLD_DURATION }),
      withTiming(0, { duration: EXHALE_DURATION }, () => {
        if (currentCycle < CYCLES) {
          setCurrentCycle(prev => prev + 1);
          startBreathingCycle();
        } else {
          // Exercise completed
          navigation.navigate('SunBreathComplete');
        }
      })
    );

    // Schedule state changes
    setTimeout(() => {
      setInstruction('Hold');
    }, INHALE_DURATION);

    setTimeout(() => {
      setIsInhaling(false);
      setInstruction('Breathe Out');
    }, INHALE_DURATION + HOLD_DURATION);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startBreathingCycle();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.instructionContainer, animatedStyle]}>
          <Text style={styles.cycleText}>Breath {currentCycle} of {CYCLES}</Text>
          <Text style={styles.instructionText}>{instruction}</Text>
        </Animated.View>

        <View style={styles.animationContainer}>
          <SunBreathAnimation
            isInhaling={isInhaling}
            progress={progress.value}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionContainer: {
    position: 'absolute',
    top: 100,
    alignItems: 'center',
    zIndex: 1,
  },
  cycleText: {
    color: '#FFD700',
    fontSize: 20,
    marginBottom: 10,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  animationContainer: {
    width: width,
    height: height,
    position: 'absolute',
  },
});

export default SunBreathExerciseScreen; 