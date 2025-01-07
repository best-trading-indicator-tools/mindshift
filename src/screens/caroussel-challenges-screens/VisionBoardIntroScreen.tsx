import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type VisionBoardIntroScreenRouteProp = RouteProp<RootStackParamList, 'VisionBoardIntro'>;

const introContent = [
  {
    title: "Visualize Your Dreams",
    content: "A vision board is a powerful tool for manifesting your dreams and goals. It's a visual representation of your aspirations, combining images and words that resonate with your desired future."
  },
  {
    title: "The Power of Visual Manifestation",
    content: "Vision boards work through selective attention - your brain becomes primed to notice opportunities aligned with your goals. When you connect emotionally with images of your dreams, you activate your brain's ability to recognize opportunities."
  },
  {
    title: "Building Your Future",
    content: "Choose images and words that deeply resonate with your goals. Include both material aspirations and emotional states you want to achieve. Your vision board is a living document that evolves with your dreams."
  }
];

const VisionBoardIntroScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VisionBoardIntroScreenRouteProp>();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await AsyncStorage.setItem('vision_board_intro_seen', 'true');
        navigation.navigate('VisionBoard', {
          context: route.params?.challengeId ? 'challenge' : 'daily',
          challengeId: route.params?.challengeId,
          returnTo: route.params?.returnTo,
          onComplete: route.params?.onComplete
        });
      } catch (error) {
        console.error('Error saving intro state:', error);
        navigation.navigate('VisionBoard', {
          context: route.params?.challengeId ? 'challenge' : 'daily',
          challengeId: route.params?.challengeId,
          returnTo: route.params?.returnTo,
          onComplete: route.params?.onComplete
        });
      }
    }
  };

  const handleExit = () => {
    if (route.params?.challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: route.params.challengeId,
          title: 'Ultimate',
          duration: 21,
          description: '',
          image: null
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
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
          <Text style={styles.title}>{currentContent.title}</Text>
          <Text style={styles.description}>{currentContent.content}</Text>
        </View>

        {currentStep === 1 && (
          <Image 
            source={require('../../assets/illustrations/vision-board-example1.jpg')}
            style={styles.exampleImage}
            resizeMode="contain"
          />
        )}
        {currentStep === 2 && (
          <Image 
            source={require('../../assets/illustrations/vision-board-example2.png')}
            style={styles.exampleImage}
            resizeMode="contain"
          />
        )}
        {currentStep === 3 && (
          <Image 
            source={require('../../assets/illustrations/vision-board-example3.jpg')}
            style={styles.exampleImage}
            resizeMode="contain"
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>
          {currentStep === totalSteps ? 'Start Creating' : 'Next'}
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
    paddingBottom: 100,
  },
  textContent: {
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.8,
    marginBottom: 20,
  },
  exampleImage: {
    width: '100%',
    height: 260,
    marginTop: 0,
    marginBottom: 60,
  },
  nextButton: {
    backgroundColor: '#E31837',
    marginHorizontal: 24,
    marginBottom: 100,
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

export default VisionBoardIntroScreen; 