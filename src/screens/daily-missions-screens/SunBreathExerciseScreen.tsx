import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import SunBreathAnimation from '../../components/sun-breath/SunBreathAnimation';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ExitModal from '../../components/ExitModal';

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
  const [showExitModal, setShowExitModal] = useState(false);
  
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleExit = () => {
    setShowExitModal(true);
  };

  const handleExitConfirm = () => {
    navigation.navigate('MainTabs');
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const startBreathingCycle = () => {
    // Start with inhale
    setIsInhaling(true);
    setInstruction('Breathe In');
    
    // Inhale animation (0 to 1)
    progress.value = withSequence(
      withTiming(1, { duration: INHALE_DURATION }, () => {
        runOnJS(setInstruction)('Hold');
      }),
      // Hold
      withDelay(HOLD_DURATION, 
        withTiming(0, { duration: EXHALE_DURATION }, () => {
          runOnJS(setIsInhaling)(false);
          runOnJS(setInstruction)('Breathe Out');
          
          // Check if we should continue to next cycle
          if (currentCycle < CYCLES) {
            runOnJS(setCurrentCycle)(c => c + 1);
            runOnJS(startBreathingCycle)();
          } else {
            // Exercise completed
            runOnJS(() => navigation.navigate('SunBreathComplete'))();
          }
        })
      )
    );
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
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={handleExit}
      >
        <MaterialCommunityIcons 
          name="close" 
          size={30} 
          color="#FFF" 
        />
      </TouchableOpacity>

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

      <ExitModal
        visible={showExitModal}
        onContinue={handleExitCancel}
        onExit={handleExitConfirm}
      />
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
  exitButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 10,
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