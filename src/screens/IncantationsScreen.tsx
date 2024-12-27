import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { markExerciseAsCompleted } from '../services/exerciseService';
import LinearGradient from 'react-native-linear-gradient';

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

const ActiveIncantationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);
  const scrollY = new Animated.Value(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;

    if (!showIntro && isScrolling) {
      scrollInterval = setInterval(() => {
        if (currentIndex < INCANTATIONS.length - 1) {
          const nextPosition = (currentIndex + 1) * (112); // fontSize + marginVertical
          scrollViewRef.current?.scrollTo({ y: nextPosition, animated: true });
          setCurrentIndex(currentIndex + 1);
        } else {
          clearInterval(scrollInterval);
        }
      }, 2500); // 2.5 seconds per affirmation
    }

    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [showIntro, isScrolling, currentIndex]);

  const handleStartScroll = () => {
    setShowIntro(false);
    setIsScrolling(true);
  };

  const handleComplete = async () => {
    setIsScrolling(false);
    try {
      await markExerciseAsCompleted('incantations');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to mark exercise as completed:', error);
    }
  };

  if (showIntro) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#3730A3', '#6366F1', '#818CF8']}
          style={styles.introContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.introTitle}>Active Incantations</Text>
          <Text style={styles.introText}>
            Reading affirmations out loud daily is a powerful way to reprogram your subconscious mind.
            {'\n\n'}
            Speak each affirmation with conviction, feeling the emotion behind the words.
            {'\n\n'}
            Take deep breaths between affirmations and visualize yourself embodying these statements.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartScroll}
          >
            <Text style={styles.startButtonText}>Start the Mission</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        scrollEnabled={false}
      >
        {INCANTATIONS.map((text, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.incantationText,
              {
                opacity: currentIndex === index ? 1 : 0.3
              }
            ]}
          >
            {text}
          </Animated.Text>
        ))}
      </Animated.ScrollView>
      
      <TouchableOpacity 
        style={styles.completeButton}
        onPress={handleComplete}
      >
        <Text style={styles.completeButtonText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  introContainer: {
    flex: 1,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 60,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  introText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 40,
    width: '100%',
    paddingHorizontal: 32,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 40,
    marginTop: 40,
  },
  startButtonText: {
    color: '#6366F1',
    fontSize: 22,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 40,
    minHeight: SCREEN_HEIGHT,
    justifyContent: 'center',
  },
  incantationText: {
    fontSize: 32,
    color: '#FFFFFF',
    marginVertical: 40,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 44,
    width: '100%',
    paddingHorizontal: 32,
  },
  completeButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#6366F1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActiveIncantationsScreen; 