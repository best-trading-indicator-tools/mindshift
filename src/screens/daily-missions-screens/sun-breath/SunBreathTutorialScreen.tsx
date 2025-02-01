import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import { audioService, AUDIO_FILES } from '../../../services/audioService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathTutorial'>;

type RouteParams = {
  context?: 'challenge' | 'daily';
  challengeId?: string;
  returnTo?: keyof RootStackParamList;
};

type Props = NativeStackScreenProps<RootStackParamList, 'SunBreathTutorial'>;

export const tutorialSteps = [
  {
    title: "The Breath of the Sun",
    content: "A powerful breathing exercise to absorb light and release negativity.\n\nTake some deep breaths while visualizing golden light entering your body, then release dark clouds of negativity.",
    icon: "white-balance-sunny"
  },
  {
    title: "Breathe In Light",
    content: "As you breathe in, imagine drawing in golden sunlight through your nose. Visualize this light filling your entire body with warmth and positive energy.",
    icon: "weather-sunny"
  },
  {
    title: "Hold the Light",
    content: "Briefly hold your breath, allowing the light to spread throughout your body, energizing every cell.",
    icon: "star-four-points"
  },
  {
    title: "Release Darkness",
    content: "As you exhale through your mouth, visualize dark clouds of negativity leaving your body, carried away by your breath.",
    icon: "weather-cloudy"
  },
  {
    title: "Practice Flow",
    content: "We'll guide you through 5 complete breath cycles.\n\nEach cycle includes by default a 4-second inhale, 1-second hold, and 6-second exhale.",
    icon: "repeat"
  }
];


const SunBreathTutorialScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(true);

  useEffect(() => {
    const preloadResources = async () => {
      try {
        const [inSound, outSound] = await Promise.all([
          audioService.loadSound(AUDIO_FILES.SUN_BREATHE_IN),
          audioService.loadSound(AUDIO_FILES.SUN_BREATHE_OUT)
        ]);

        // No need for prepare, just release after loading
        inSound.release();
        outSound.release();

        setIsAudioLoading(false);
      } catch (error) {
        console.error('Error preloading resources:', error);
        setIsAudioLoading(false); // Set loading to false even on error
      }
    };

    preloadResources();
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!isAudioLoading) {
        navigation.navigate('SunBreathExercise', {
          context: route.params?.challengeId ? 'challenge' : 'daily',
          challengeId: route.params?.challengeId,
          returnTo: route.params?.returnTo
        });
      }
    }
  };

  const handleExit = async () => {
    if (route.params?.challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: route.params.challengeId,
          title: 'Ultimate',
          duration: 21,
          description: 'Your subconscious mind shapes your reality.',
          image: require('../../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };


  const currentTutorial = tutorialSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <ProgressHeader
        currentStep={currentStep + 1}
        totalSteps={tutorialSteps.length}
        onExit={handleExit}
        onNext={handleNext}
        showNext={true}
      />

      <View style={styles.content}>
        <MaterialCommunityIcons 
          name={currentTutorial.icon} 
          size={100} 
          color="#FFD700" 
        />
        
        <Text style={styles.title}>{currentTutorial.title}</Text>
        <Text style={styles.description}>{currentTutorial.content}</Text>

        <TouchableOpacity
          style={[styles.button, isAudioLoading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={isAudioLoading}
        >
          <Text style={styles.buttonText}>
            {currentStep === tutorialSteps.length - 1 
              ? isAudioLoading 
                ? "Loading..." 
                : "Start Exercise" 
              : "Next"}
          </Text>
          {isAudioLoading && (
            <ActivityIndicator 
              size="small" 
              color="#000" 
              style={styles.loadingIndicator} 
            />
          )}
        </TouchableOpacity>
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
});

export default SunBreathTutorialScreen; 