import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'GratitudeBeadsIntro'>;

const introContent = [
  {
    title: "The Power of Gratitude Beads",
    content: "For thousands of years, monks and spiritual practitioners have used beads to cultivate mindfulness and gratitude. This practice combines ancient wisdom with modern science to enhance your well-being."
  },
  {
    title: "Scientific Benefits",
    content: "Research shows that expressing gratitude increases happiness by 25%, reduces stress by 23%, and improves sleep quality. Speaking gratitude aloud activates multiple areas of your brain, strengthening the positive effects."
  },
  {
    title: "How to Practice",
    content: "Touch and hold each bead while speaking your gratitude aloud.\n\nThe format is:\n\n\"I am grateful for [something] because [reason]\"\n\nTake your time with each bead - the deeper you reflect, the more powerful the practice."
  },
  {
    title: "Example Gratitudes",
    content: "\"I am grateful for my morning coffee because it gives me a peaceful moment to start my day.\"\n\n\"I am grateful for challenges because they help me grow stronger.\"\n\n\"I am grateful for my friend Sarah because she always listens without judgment.\""
  },
  {
    title: "Ready to Begin?",
    content: "Remember to:\n\n• Speak each gratitude aloud\n\n• Hold the bead until it's validated\n\n• Be specific with your reasons\n\nThis practice becomes more powerful with each day you do it."
  }
];

const GratitudeBeadsIntroScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === totalSteps) {
      try {
        await AsyncStorage.setItem('gratitude_beads_intro_seen', 'true');
        //navigation.push('GratitudeBeads');
      } catch (error) {
        console.error('Error saving intro state:', error);
        //navigation.push('GratitudeBeads');
      }
      navigation.push('GratitudeBeads');
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
    marginTop: 20,
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.8,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#E31837',
    marginHorizontal: 24,
    marginBottom: 80,
    paddingVertical: 16,
    borderRadius: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GratitudeBeadsIntroScreen; 