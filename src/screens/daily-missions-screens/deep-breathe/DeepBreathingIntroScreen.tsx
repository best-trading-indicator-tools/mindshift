import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathingIntro'>;

const introContent = [
  {
    title: "Deep Breathing",
    content: "Take a moment to find peace and calmness. Deep breathing is a powerful tool to reduce stress and anxiety, helping you center yourself in the present moment."
  },
  {
    title: "How It Works",
    content: "Follow the guided breathing exercise: inhale deeply through your nose, hold briefly, then exhale slowly through your mouth. This practice will help you relax and restore balance to your mind and body."
  }
];

const { width } = Dimensions.get('window');
const ANIMATION_SIZE = width * 0.5; // 50% of screen width

// TODO: Add animations when available
const BREATHING_ANIMATIONS = {
  1: require('../../../assets/illustrations/intros/deep-breathe/breathe-intro-1.lottie'),
  2: require('../../../assets/illustrations/intros/deep-breathe/breathe-intro-2.lottie'), // Temporarily reuse first animation
};

const DeepBreathingIntroScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await AsyncStorage.setItem('deep_breathing_intro_seen', 'true');
        
        navigation.navigate('DeepBreathing', {
          context: route.params?.challengeId ? 'challenge' : 'daily',
          challengeId: route.params?.challengeId,
          returnTo: route.params?.returnTo
        });
      } catch (error) {
        console.error('Error saving intro state:', error);
      }
    }
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const currentContent = introContent[currentStep - 1];
  const currentAnimation = BREATHING_ANIMATIONS[currentStep as keyof typeof BREATHING_ANIMATIONS];

  return (
    <LinearGradient 
      colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
      style={styles.container}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
    >
      <View style={styles.mainContainer}>
        <ProgressHeader
          currentStep={currentStep}
          totalSteps={totalSteps}
          onExit={handleExit}
          onNext={handleNext}
          showNext={true}
        />

        <View style={styles.content}>
          <View style={styles.textContent}>
            <Text style={styles.title}>{currentContent.title}</Text>
            
            <View style={styles.lottieContainer}>
              <LottieView
                source={currentAnimation}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>

            <Text style={styles.description}>{currentContent.content}</Text>
          </View>
        </View>

        <View style={styles.nextButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Start Exercise' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginTop: -10,
  },
  textContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  lottieContainer: {
    width: ANIMATION_SIZE,
    height: ANIMATION_SIZE,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: '85%',
    letterSpacing: 0.3,
  },
  nextButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    width: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    backgroundColor: '#BFA030',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default DeepBreathingIntroScreen; 