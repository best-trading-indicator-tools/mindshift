import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyGratitudeIntro'>;

const introContent = [
  {
    title: "The Power of Gratitude",
    content: "Gratitude is your daily boost of happiness. Science proves it reduces stress and trains your mind to see the bright side of life."
  },
  {
    title: "The Magic of 'Because'",
    content: "Add 'because' to transform simple gratitude into deep appreciation. It helps you connect with the real meaning behind your thankfulness."
  },
  {
    title: "Express Your Way",
    content: "Type it or say it - your choice! Express gratitude in the way that feels most natural to you. Both methods are equally powerful."
  },
  {
    title: "Try This Example",
    content: "✨ \"I'm grateful for my friend because they always listen without judgment\"\n\nvs\n\n\"I'm grateful for my friend\"\n\nFeel the difference?"
  }
];

// Temporarily use the same animation for all steps
const GRATITUDE_ANIMATION = require('../../../assets/illustrations/intros/daily-gratitude/intro-1.lottie');

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

  const handleMeditationPress = () => {
    navigation.navigate('SelfHypnosisIntro', {
      returnTo: route.params?.returnTo,
      challengeId: route.params?.challengeId
    });
  };

  const currentContent = introContent[currentStep - 1];

  useEffect(() => {
    console.log('DailyGratitudeIntro mounted with route params:', route.params);
  }, [route.params]);

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

        <TouchableOpacity 
          style={styles.effectivenessTip}
          onPress={handleMeditationPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="meditation" size={18} color="rgba(255, 255, 255, 0.95)" />
          <Text style={styles.effectivenessTipText}>Enhance your practice with guided meditation</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.95)" style={styles.chevronIcon} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.textContent}>
            <Text style={styles.title}>{currentContent.title}</Text>
            
            <View style={styles.lottieContainer}>
              <LottieView
                source={GRATITUDE_ANIMATION}
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

const { width } = Dimensions.get('window');
const ANIMATION_SIZE = width * 0.5; // 50% of screen width

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
  effectivenessTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 24,
    marginHorizontal: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  effectivenessTipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 0.3,
    lineHeight: 20,
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 12,
    opacity: 0.9,
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
    width: '45%',
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

export default DailyGratitudeIntroScreen; 