import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'SelfHypnosisIntro'>;

const introContent = [
  {
    title: "Self-Hypnosis",
    content: "Welcome to a journey of deep relaxation and mental receptivity.\n\nSelf-hypnosis is a powerful technique to access and reprogram your subconscious mind, making your other exercises more effective."
  },
  {
    title: "How It Works",
    content: "Through a series of calming audio sessions, you'll be guided into a state of deep relaxation.\n\nThis heightened state of receptivity allows your mind to become more open to positive suggestions and transformative thoughts."
  },
  {
    title: "Benefits",
    content: "Regular practice enhances the effectiveness of your other exercises by making your subconscious mind more receptive to change.\n\nIt's like preparing fertile soil before planting seeds of transformation."
  }
];

const SelfHypnosisIntroScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await AsyncStorage.setItem('self_hypnosis_intro_seen', 'true');
        
        navigation.navigate('SelfHypnosisExercise', {
          context: route.params?.challengeId ? 'challenge' : 'daily',
          challengeId: route.params?.challengeId,
          returnTo: route.params?.returnTo,
          onComplete: route.params?.onComplete
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
    backgroundColor: '#E6B800',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SelfHypnosisIntroScreen;
