import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  return (
    <View style={styles.container}>
      <ProgressHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        onExit={handleExit}
        onNext={handleNext}
        showNext={true}
      />

      <View style={styles.content}>
        <View style={styles.textContent}>
          {currentContent && (
            <>
              <Text style={styles.title}>{currentContent.title}</Text>
              <Text style={styles.description}>{currentContent.content}</Text>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>
          {currentStep === totalSteps ? 'Start Exercise' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  textContent: {
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  nextButton: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GuidedRelaxationIntroScreen; 