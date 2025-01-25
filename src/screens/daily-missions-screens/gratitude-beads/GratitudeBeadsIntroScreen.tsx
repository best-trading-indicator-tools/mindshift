import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

type RouteParams = {
  context?: 'challenge' | 'daily';
  challengeId?: string;
  returnTo?: keyof RootStackParamList;
};

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
    content: "1. Press a highlighted bead to open the recording screen\n\n2. Speak your gratitude aloud into the microphone\n\n3. Tap the red button when you're done recording\n\nThe format is:\n\"I am grateful for [something] because [reason]\"\n\nTake your time with each bead - the deeper you reflect, the more powerful the practice."
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

const { width } = Dimensions.get('window');
const ANIMATION_SIZE = width * 0.5; // 50% of screen width

const BEADS_ANIMATIONS = {
  1: require('../../../assets/illustrations/intros/gratitude-beads/beads-intro-1.lottie'),
  2: require('../../../assets/illustrations/intros/gratitude-beads/beads-intro-2.lottie'),
  3: require('../../../assets/illustrations/intros/gratitude-beads/beads-intro-3.lottie'),
};

const GratitudeBeadsIntroScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === totalSteps) {
      try {
        await AsyncStorage.setItem('gratitude_beads_intro_seen', 'true');
      } catch (error) {
        console.error('Error saving intro state:', error);
      }
      navigation.navigate('GratitudeBeads', {
        context: route.params?.challengeId ? 'challenge' : 'daily',
        challengeId: route.params?.challengeId,
        returnTo: route.params?.returnTo
      });
    }
  };

  const handleExit = async () => {
    if (route.params?.context === 'challenge' && route.params.challengeId) {
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

  const currentContent = introContent[currentStep - 1];
  const currentAnimation = BEADS_ANIMATIONS[currentStep as keyof typeof BEADS_ANIMATIONS];

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
          <View style={styles.effectivenessTip}>
            <MaterialCommunityIcons name="information" size={18} color="#000000" />
            <Text style={styles.effectivenessTipText}>3x more effective after Self-Hypnosis</Text>
          </View>

          <View style={styles.textContent}>
            {currentContent && (
              <>
                <Text style={styles.title}>{currentContent.title}</Text>
                
                {currentAnimation && (
                  <View style={styles.lottieContainer}>
                    <LottieView
                      source={currentAnimation}
                      autoPlay
                      loop
                      style={styles.lottieAnimation}
                    />
                  </View>
                )}

                <Text style={styles.description}>{currentContent.content}</Text>
              </>
            )}
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
    paddingBottom: 80,
  },
  textContent: {
    paddingTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 20,
  },
  description: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: '85%',
    letterSpacing: 0.3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  nextButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
  effectivenessTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 32,
    marginTop: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  effectivenessTipText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  lottieContainer: {
    width: ANIMATION_SIZE,
    height: ANIMATION_SIZE,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
});

export default GratitudeBeadsIntroScreen; 