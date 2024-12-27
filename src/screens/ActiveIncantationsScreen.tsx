import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, SafeAreaView, Modal, TouchableWithoutFeedback, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { markExerciseAsCompleted } from '../services/exerciseService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import ExerciseIntroScreen from '../components/ExerciseIntroScreen';
import ExitExerciseButton from '../components/ExitExerciseButton';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveIncantations'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const INCANTATIONS = [
  "I am a beacon of positivity",
  "I am always in motion",
  "I live each day as if it were my last",
  "I eat slowly",
  "I am grateful for this day",
  "My current limits are false",
  "I speak with intention",
  "I embody my ultra EGO every day",
  "I know I can accomplish the impossible",
  "Today, I will be pleasantly surprised",
  "I easily face and overcome challenges",
  "The harder it is, the better",
  "Having to decide to do these activities doesn't drain me",
  "I sleep wonderfully well",
  "Disciplined life makes me happy",
  "I achieve my goals effortlessly",
  "I honor my worth",
  "I work until 9pm",
  "I am pure energy",
  "I earn money easily and effortlessly",
  "I love working on my projects every day",
  "I have amazing friends",
  "I use my time to do things that matter to me",
  "I do my abs every day",
  "Today is a special day for me",
  "My life is a series of good decisions",
  "I only consume content that positively changes my life",
  "I learn from all experiences in life",
  "I train for an hour every day",
  "I eat slowly",
  "I have positive and optimistic thoughts today",
  "I am at peace",
  "I love my life",
  "I speak slowly",
  "I deliberately take a pause after each sentence",
  "I train every day",
  "I open my heart for wonderful things to come to me",
  "I am grateful for every moment of life",
  "My friends and family are extraordinary",
  "My daily decisions lead to my goals",
  "I am charismatic",
  "My life is important, the smallest actions can make a difference",
  "I love myself for who I am",
  "I deserve the love I receive",
  "I am a source of inspiration for those around me",
  "I speak with a deep, descending voice",
  "I accomplish everything I invest myself in",
  "I am grateful for the riches in my life",
  "I stretch every evening",
  "Every hour, I get up and do a physical exercise",
  "I speak very fluently",
  "I am a successful person",
  "When I am determined, nothing can stop me",
  "I don't eat after 4pm",
  "I open my mouth wide when I speak",
  "I master my emotions and can change my state in an instant",
  "My body is my temple",
  "I have fulfilling relationships",
  "I feel joy at this precise moment",
  "By allowing myself to be happy, I inspire others to be happy too",
  "My heart overflows with joy and love",
  "I smile and my day lights up",
  "I start my day with a positive attitude",
  "I am grateful to have woken up this morning",
  "I over-articulate",
  "I always give my best",
  "I have complete confidence in myself",
  "I am safe",
  "I am free from negative thoughts",
  "I know I can do it",
  "I love myself and I am in perfect health",
  "I am fortunate",
  "I have a deep voice",
  "I read 50 pages a day",
  "I work on my back every day",
  "Making money is easy for me",
  "I deserve to be happy",
  "I have a sense of humor and love laughing with people I love",
  "I nourish my body with healthy foods",
  "I trust my inner wisdom and intuition",
  "I love my work and have excellent results",
  "I am the architect of my life",
  "This day is going to be wonderfully good",
  "My mind is filled with positive thoughts and my heart with love",
  "This morning, I say thank you to life",
  "Today, I will be the best version of myself",
  "I move fast (Tate)",
  "I am focused on my goal",
  "I attract everything I desire",
  "I am patient and serene",
  "Each day is a new opportunity to do what I love",
  "I decide that today will be a great day",
  "I attract good people into my life",
  "I believe in myself and my abilities",
  "I have a lot of value",
  "I am at peace with my past",
  "I dare to step out of my comfort zone",
  "Day by day, I feel better and better",
  "I decide to give up my negative thoughts",
  "I deserve the best that life has to offer",
  "I welcome change with open arms",
  "I am strong and ambitious",
  "I have an impactful voice",
  "I stretch every day",
  "I am an accomplished person",
  "I dare to dream big",
  "I am free",
  "I feel in harmony with everything around me",
  "I express myself with ease",
  "I hold the keys to my success",
  "I succeed in everything I undertake",
  "I connect to the present moment and fully live this day",
  "I treat myself with the respect I deserve",
  "I overflow with energy. I sleep wonderfully well",
  "Every day, I create the life of my dreams",
  "I am perseverant and never give up",
  "I am a magnet that attracts fortune",
  "I exceed my limits every day",
  "I enjoy every second given to me",
  "I focus my attention on positive things",
  "I am an incredible person",
  "I listen to my intuitions",
  "I celebrate even my smallest successes",
  "I am creative and have lots of good ideas",
  "I am pure energy",
  "I live my life with enthusiasm and passion",
  "I am open to the magic of life",
  "I am the master of my thoughts and actions"
];

const SCROLL_INTERVAL = 3000; // Increase to 3 seconds per affirmation

const ActiveIncantationsScreen: React.FC<Props> = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const ITEM_HEIGHT = 112;
  const windowHeight = Dimensions.get('window').height;
  const TOP_PADDING = 100;
  const BOTTOM_PADDING = windowHeight - TOP_PADDING - ITEM_HEIGHT;
  const VISIBLE_ITEMS = Math.floor((windowHeight - TOP_PADDING) / ITEM_HEIGHT);

  const scrollToIndex = (index: number) => {
    const scrollPosition = index * ITEM_HEIGHT;
    scrollViewRef.current?.scrollTo({
      y: scrollPosition,
      animated: true,
    });
  };

  const getVisibleIndex = (yOffset: number) => {
    // Calculate which item should be at the top of the visible area
    const index = Math.floor(yOffset / ITEM_HEIGHT);
    // Make sure we don't return an invalid index
    if (index < 0 || index >= INCANTATIONS.length) return 0;
    return index;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setScrollPosition(yOffset);
    const newIndex = getVisibleIndex(yOffset);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const startScrolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Ensure we're starting from a valid position
    scrollToIndex(currentIndex);

    intervalRef.current = setInterval(() => {
      if (currentIndex < INCANTATIONS.length - 1) {
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          // Ensure we don't scroll past the end
          if (nextIndex >= INCANTATIONS.length) {
            clearInterval(intervalRef.current!);
            setHasReachedEnd(true);
            return prevIndex;
          }
          scrollToIndex(nextIndex);
          return nextIndex;
        });
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setHasReachedEnd(true);
      }
    }, SCROLL_INTERVAL);
  };

  // Update the main effect to handle scrolling
  useEffect(() => {
    if (!showIntro && !isPaused && !hasReachedEnd && !showExitModal) {
      startScrolling();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showIntro, isPaused, hasReachedEnd, showExitModal]);

  // Remove the separate effect for initial position as it's now handled in startScrolling
  useEffect(() => {
    if (!showIntro) {
      setCurrentIndex(0);
      scrollToIndex(0);
    }
  }, [showIntro]);

  const handleStartExercise = () => {
    setShowIntro(false);
    setIsPaused(false);
  };

  const handleTapScreen = () => {
    if (!showExitModal) {
      setIsPaused(!isPaused);
      if (isPaused) {
        startScrolling();
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }
  };

  const handleComplete = async () => {
    try {
      await markExerciseAsCompleted('active-incantations');
      navigation.goBack();
    } catch (error) {
      console.error('Error marking exercise as completed:', error);
    }
  };

  const handleExitPress = () => {
    setShowExitModal(true);
  };

  const handleContinue = () => {
    setShowExitModal(false);
    setIsPaused(false);
    startScrolling();
  };

  const handleExit = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setShowExitModal(false);
    setTimeout(() => {
      navigation.navigate('MainTabs');
    }, 0);
  };

  useEffect(() => {
    console.log('Modal state changed:', { showExitModal });
  }, [showExitModal]);

  if (showIntro) {
    return (
      <ExerciseIntroScreen
        title="Active Incantations"
        description={
          "Speak these affirmations with conviction.\n\n" +
          "Tap the screen to pause/resume the auto-scroll.\n\n" +
          "Take deep breaths between affirmations and visualize yourself embodying these statements."
        }
        buttonText="Start Exercise"
        onStart={handleStartExercise}
        onExit={handleExit}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.content} 
        onPress={handleTapScreen}
        activeOpacity={1}
        disabled={showExitModal}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: TOP_PADDING,
              paddingBottom: BOTTOM_PADDING,
            }
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          pointerEvents={showExitModal ? 'none' : 'auto'}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {INCANTATIONS.map((text, index) => (
            <Text
              key={index}
              style={[
                styles.affirmationText,
                {
                  opacity: currentIndex === index ? 1 : 0.3
                }
              ]}
            >
              {text}
            </Text>
          ))}
        </ScrollView>

        {isPaused && !showExitModal && (
          <View style={styles.pauseOverlay}>
            <MaterialCommunityIcons 
              name="pause-circle" 
              size={60} 
              color="rgba(255, 255, 255, 0.5)" 
            />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.bottomExitButton}
        onPress={handleExitPress}
      >
        <Text style={styles.bottomExitButtonText}>Exit</Text>
      </TouchableOpacity>

      {hasReachedEnd && (
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              You're making progress! Continue practicing to maintain your results.
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.continueButton]}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.exitButton]}
              onPress={handleExit}
            >
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: SCREEN_HEIGHT / 3,
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 40,
    paddingHorizontal: 32,
    lineHeight: 40,
  },
  pauseOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#6366F1',
  },
  exitButton: {
    backgroundColor: '#FFD700',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomExitButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  bottomExitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActiveIncantationsScreen; 