import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

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
    content: "Choose images and words that deeply resonate with your goals. Include both material aspirations and emotional states you want to achieve.\n\nYour vision board is a living document that evolves with your dreams."
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
          returnTo: route.params?.returnTo
        });
      } catch (error) {
        console.error('Error saving intro state:', error);
        navigation.navigate('VisionBoard', {
          context: route.params?.challengeId ? 'challenge' : 'daily',
          challengeId: route.params?.challengeId,
          returnTo: route.params?.returnTo
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

        <View style={styles.nextButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Start Creating' : 'Next'}
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
    marginTop: 0,
  },
  description: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: '100%',
    letterSpacing: 0.3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  exampleImage: {
    width: '100%',
    height: 260,
    marginTop: 0,
    marginBottom: 60,
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
});

export default VisionBoardIntroScreen; 