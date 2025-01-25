import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type RouteParams = {
  context?: 'challenge' | 'daily';
  challengeId?: string;
  returnTo?: keyof RootStackParamList;
};

type Props = NativeStackScreenProps<RootStackParamList, 'PassiveIncantationsIntro'>;

const introContent = [
  {
    title: "The Power of Your Voice",
    content: "Your voice has a unique ability to influence your mind.\nWhen you listen to your own affirmations, your brain processes them more deeply than any other sound."
  },
  {
    title: "Alpha Wave Magic",
    content: "During daily activities, your brain enters a receptive 'alpha' state - the perfect moment for your affirmations to create lasting change."
  }
];

const { width } = Dimensions.get('window');
const ANIMATION_SIZE = width * 0.5; // 50% of screen width

const INCANTATION_ANIMATIONS = {
  1: require('../../../assets/illustrations/intros/passive-incantations/incantation-intro-1.lottie'),
  2: require('../../../assets/illustrations/intros/passive-incantations/incantation-intro-2.lottie'),
};

const PassiveIncantationsIntroScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await AsyncStorage.setItem('passive_incantations_intro_seen', 'true');
      } catch (error) {
        console.error('Error saving intro state:', error);
      }
      navigation.navigate('PassiveIncantations', {
        context: route.params?.challengeId ? 'challenge' : 'daily',
        challengeId: route.params?.challengeId,
        returnTo: route.params?.returnTo
      });
    }
  };

  const handleExit = () => {
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
      navigation.goBack();
    }
  };

  const handleEffectivenessTipPress = () => {
    navigation.navigate('SelfHypnosisIntro', {
      challengeId: route.params?.challengeId,
      returnTo: route.params?.returnTo
    });
  };

  const currentContent = introContent[currentStep - 1];
  const currentAnimation = INCANTATION_ANIMATIONS[currentStep as keyof typeof INCANTATION_ANIMATIONS];

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
          <Pressable 
            style={({ pressed }) => [
              styles.effectivenessTip,
              pressed && styles.effectivenessTipPressed
            ]}
            onPress={handleEffectivenessTipPress}
          >
            <MaterialCommunityIcons name="information-outline" size={20} color="#000000" />
            <Text style={styles.effectivenessTipText}>3x more effective after Self-Hypnosis</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#000000" />
          </Pressable>

          <View style={styles.textContent}>
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
    paddingBottom: 120,
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
    marginTop: 15,
  },
  description: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: '95%',
    letterSpacing: 0.3,
    alignSelf: 'center',
    marginBottom: 40,
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
  effectivenessTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'space-between',
  },
  effectivenessTipText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    letterSpacing: 0.3,
    flex: 1,
  },
  effectivenessTipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default PassiveIncantationsIntroScreen; 