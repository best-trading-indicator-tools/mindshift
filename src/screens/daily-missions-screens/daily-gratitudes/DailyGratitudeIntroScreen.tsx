import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyGratitudeIntro'>;

const introContent = [
  {
    title: "The Power of Gratitude",
    content: "Science has shown that practicing gratitude can significantly boost happiness and reduce stress. This simple yet powerful practice rewires your brain to focus on the positive aspects of life."
  },
  {
    title: "The Magic of 'Because'",
    content: "When expressing gratitude, adding 'because' makes it more meaningful. Instead of just saying what you're grateful for, explaining why deepens the emotional impact and helps you truly appreciate the value it brings to your life."
  },
  {
    title: "Express Your Way",
    content: "You can express your gratitude by typing or using voice recording. Some find it easier to speak their gratitude, while others prefer writing. Choose what feels most natural to you - both are equally powerful."
  },
  {
    title: "Example",
    content: "Instead of \"I'm grateful for my friend\", try \"I'm grateful for my friend because they always listen and support me without judgment.\" Notice how much more powerful and specific this feels."
  }
];

const DailyGratitudeIntroScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await AsyncStorage.setItem('daily_gratitude_intro_seen', 'true');
        navigation.navigate('DailyGratitude', {
          context: route.params?.context || 'daily',
          challengeId: route.params?.challengeId,
          returnTo: route.params?.returnTo
        });
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  const handleExit = async () => {
    if (route.params?.returnTo === 'ChallengeDetail' && route.params?.challengeId) {
      await AsyncStorage.setItem('exiting_gratitude_intro', 'true');
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const currentContent = introContent[currentStep - 1];

  useEffect(() => {
    console.log('DailyGratitudeIntro mounted with route params:', route.params);
  }, [route.params]);

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
        <View style={styles.effectivenessTip}>
          <MaterialCommunityIcons name="star" size={20} color="#6366F1" />
          <Text style={styles.effectivenessTipText}>2x more effective after Self-Hypnosis</Text>
        </View>

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
    opacity: 0.8,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#B91C1C',
    marginHorizontal: 24,
    marginBottom: 120,
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
  effectivenessTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 32,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  effectivenessTipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
});

export default DailyGratitudeIntroScreen; 