import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'GuidedRelaxationIntro'>;

const introContent = [
  {
    title: "Sleep Better Tonight",
    content: "Welcome to your nightly relaxation journey.\n\nThese guided sessions are designed to help you unwind, relax, and prepare your mind and body for restful sleep."
  },
  {
    title: "How It Works",
    content: "Through carefully crafted audio sessions, you'll be guided into a state of deep relaxation.\n\nThe combination of soothing voice guidance and calming background sounds helps quiet your mind and ease physical tension."
  },
  {
    title: "Best Practices",
    content: "Find a quiet, comfortable place to lie down.\n\nUse headphones for the best experience.\n\nIt's okay if you fall asleep during the session - that's actually a good sign!"
  }
];

const GuidedRelaxationIntroScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await AsyncStorage.setItem('guided_relaxation_intro_seen', 'true');
        navigation.navigate('GuidedRelaxationExercise');
      } catch (error) {
        console.error('Error saving intro state:', error);
      }
    }
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const currentContent = introContent[currentStep - 1];

  const getLottieSource = (step: number) => {
    switch (step) {
      case 1:
        return require('../../../assets/illustrations/intros/guided-relaxation/relax-intro-1.lottie');
      case 2:
        return require('../../../assets/illustrations/intros/guided-relaxation/relax-intro-2.lottie');
      case 3:
        return require('../../../assets/illustrations/intros/guided-relaxation/relax-intro-3.lottie'); // Temporarily reuse first animation
      default:
        return require('../../../assets/illustrations/intros/guided-relaxation/relax-intro-1.lottie');
    }
  };

  const renderContent = () => {
    return (
      <View style={styles.content}>
        <Text style={styles.title}>{currentContent.title}</Text>
        <View style={styles.illustrationContainer}>
          <LottieView
            source={getLottieSource(currentStep)}
            autoPlay
            loop
            style={styles.illustration}
          />
        </View>
        <Text style={styles.description}>{currentContent.content}</Text>
      </View>
    );
  };

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

        {renderContent()}

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
  },
  illustrationContainer: {
    height: 180,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  nextButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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

export default GuidedRelaxationIntroScreen; 