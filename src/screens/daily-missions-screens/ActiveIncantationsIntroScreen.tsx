import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveIncantationsIntro'>;

const introContent = [
  {
    title: "Active Incantations",
    content: "Active incantations are powerful positive affirmations spoken with conviction and purpose.\n\nBy speaking these statements aloud, you actively program your mind for success and positivity."
  },
  {
    title: "Customize Your Practice",
    content: "You can personalize your incantations by:\n\n• Reordering them with drag & drop\n• Adding your own affirmations\n• Removing ones that don't resonate\n\nMake this practice truly yours."
  },
  {
    title: "Daily Practice",
    content: "Speak each affirmation with conviction.\n\nTake deep breaths between statements and visualize yourself embodying these truths.\n\nJust 5 minutes a day can create lasting change."
  },
  {
    title: "Easy Management",
    content: "Tap 'Edit' to start organizing.\n\nPress and hold to drag & drop incantations into your preferred order.\n\nUse the pencil icon to modify text or the trash icon to remove ones that don't resonate."
  }
];

const ActiveIncantationsIntroScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.push('ManageActiveIncantations');
    }
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const currentContent = introContent[currentStep - 1];
  const isLastStep = currentStep === totalSteps;

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
        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentContent.title}</Text>
          <Text style={styles.description}>{currentContent.content}</Text>
        </View>
        
        {isLastStep ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.push('ManageActiveIncantations')}
          >
            <Text style={styles.startButtonText}>Start Practice</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
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
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.8,
  },
  startButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    marginBottom: 100,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ActiveIncantationsIntroScreen; 