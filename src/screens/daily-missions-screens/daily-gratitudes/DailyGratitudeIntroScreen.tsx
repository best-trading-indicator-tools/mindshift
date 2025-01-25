import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ProgressHeader from '../../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

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
      colors={['#2D1B3F', '#3B1D35', '#4A1625']} 
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
          <Text style={styles.effectivenessTipText}>Try our guided meditation first to 3X the benefits</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.95)" style={styles.chevronIcon} />
        </TouchableOpacity>

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
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.5,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 24,
    marginHorizontal: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  effectivenessTipText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
    letterSpacing: 0.3,
    lineHeight: 20,
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  nextButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  nextButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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