import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Dimensions, ImageBackground, StatusBar } from 'react-native';
import { Text } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isChallengeExerciseCompleted, markChallengeExerciseAsCompleted, isChallengeExerciseUnlocked } from '../../utils/exerciseCompletion';
import { addNotification } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;

type TabType = 'trainings' | 'preview';

interface Exercise {
  id: string;
  title: string;
  description: string;
  week: number;
  image?: any;
}

const ExerciseCard: React.FC<Exercise & { 
  challengeId: string; 
  isCompleted: boolean; 
  onComplete: () => void;
  index: number;
  isUnlocked: boolean;
  isCurrent: boolean;
}> = ({ 
  id, 
  title, 
  description, 
  isCompleted,
  onComplete,
  challengeId,
  index,
  isUnlocked,
  isCurrent,
  image
}) => {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.cardTopSection}>
        {image && (
          <>
            <Image
              source={image}
              style={styles.exerciseBackgroundImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(21, 25, 50, 0)', 'rgba(21, 25, 50, 0.9)']}
              style={styles.gradientOverlay}
            />
          </>
        )}
      </View>
      
      <View style={styles.cardBottomSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.exerciseTitle}>{title}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <MaterialCommunityIcons name="check" size={16} color="#000" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
          {!isUnlocked && (
            <View style={styles.lockedBadge}>
              <MaterialCommunityIcons name="lock" size={16} color="#FFFFFF" />
              <Text style={styles.lockedText}>Locked</Text>
            </View>
          )}
        </View>

        <View style={styles.exerciseContent}>
          <Text style={styles.exerciseDescription}>{description}</Text>
          <TouchableOpacity 
            style={[
              styles.startButton,
              !isUnlocked && styles.startButtonLocked
            ]}
            onPress={onComplete}
            disabled={!isUnlocked}
          >
            <Text style={[
              styles.startButtonText,
              !isUnlocked && styles.startButtonTextLocked
            ]}>
              {isCompleted ? 'Restart Training' : isUnlocked ? 'Start Training' : 'Complete Previous Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ChallengeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const challengeId = route.params?.challenge?.id;
  const challenge = challengeId === '2' ? {
    id: '2',
    title: 'Deep Mind Programming',
    duration: 7,
    description: 'Maximize your mindset transformation through strategic exercise sequencing. This 7-day challenge uses the power of self-hypnosis to amplify the effects of gratitude and affirmations.',
    image: require('../../assets/illustrations/challenges/challenge-21.png')
  } : {
    id: '1',
    title: 'Ultimate',
    duration: 21,
    description: 'Your subconscious mind shapes your reality. This 21-day challenge uses proven techniques to rewire your thought patterns and transform your mindset.\nPerfect for anyone seeking deeper happiness, lasting motivation, and emotional well-being.',
    image: require('../../assets/illustrations/challenges/challenge-21.png')
  };
  const [activeTab, setActiveTab] = useState<TabType>('trainings');
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [lastUnlockedExercise, setLastUnlockedExercise] = useState<Exercise | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState<string | null>(null);
  
  // Add cache ref
  const challengeStateCache = useRef<{
    completionStatus?: Record<string, boolean>;
    lastUpdate?: number;
  }>({});

  const exercises: Exercise[] = challengeId === '2' ? [
    // Day 1
    {
      id: 'self-hypnosis-1',
      title: 'Self-Hypnosis',
      description: 'Begin with self-hypnosis to open your subconscious mind and enhance receptivity to the following exercises.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'active-incantations-1',
      title: 'Active Incantations',
      description: 'While your mind is in a receptive state, practice powerful affirmations to reinforce positive beliefs.',
      week: 1,
      image: require('../../assets/illustrations/challenges/active-incantations.png')
    },
    // Day 2
    {
      id: 'self-hypnosis-2',
      title: 'Self-Hypnosis',
      description: 'Prepare your mind for deep gratitude practice.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'daily-gratitude-2',
      title: 'Daily Gratitude',
      description: 'Express profound gratitude with your mind in an optimal state for appreciation.',
      week: 1,
      image: require('../../assets/illustrations/challenges/daily-gratitude.png')
    },
    // Day 3
    {
      id: 'self-hypnosis-3',
      title: 'Self-Hypnosis',
      description: 'Enter a state of deep receptivity before your gratitude beads practice.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'gratitude-beads-3',
      title: 'Gratitude Beads',
      description: 'Use meditation beads for a deeply mindful gratitude practice.',
      week: 1,
      image: require('../../assets/illustrations/challenges/gratitude-beads.png')
    },
    // Day 4
    {
      id: 'self-hypnosis-4',
      title: 'Self-Hypnosis',
      description: 'Prepare your mind for enhanced visualization.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'vision-board-4',
      title: 'Vision Board',
      description: 'Create and visualize your goals with heightened mental clarity.',
      week: 1,
      image: require('../../assets/illustrations/challenges/vision-board.png')
    },
    // Day 5
    {
      id: 'self-hypnosis-5',
      title: 'Self-Hypnosis',
      description: 'Open your mind to deeper self-reflection.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'golden-checklist-5',
      title: 'Golden Checklist',
      description: 'Create your ideal daily routine with enhanced awareness.',
      week: 1,
      image: require('../../assets/illustrations/challenges/golden-checklist.png')
    },
    // Day 6
    {
      id: 'self-hypnosis-6',
      title: 'Self-Hypnosis',
      description: 'Prepare for deep passive programming.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'passive-incantations-6',
      title: 'Passive Incantations',
      description: 'Listen to guided affirmations in a highly receptive state.',
      week: 1,
      image: require('../../assets/illustrations/challenges/passive-incantations.png')
    },
    // Day 7
    {
      id: 'self-hypnosis-7',
      title: 'Self-Hypnosis',
      description: 'Final deep programming session.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'active-incantations-7',
      title: 'Active Incantations',
      description: 'Conclude with powerful affirmations to lock in your progress.',
      week: 1,
      image: require('../../assets/illustrations/challenges/active-incantations.png')
    }
  ] : [
    // Original Ultimate Challenge exercises
    {
      id: 'deep-breathing',
      title: 'Deep Breathing',
      description: 'Practice deep breathing exercises to reduce stress and increase mindfulness.',
      week: 1,
      image: require('../../assets/illustrations/challenges/deep-breathing.png')
    },
    {
      id: 'daily-gratitude',
      title: 'Daily Gratitude',
      description: 'Express gratitude for three things in your life to cultivate positivity and appreciation.',
      week: 1,
      image: require('../../assets/illustrations/challenges/daily-gratitude.png')
    },
    {
      id: 'active-incantations',
      title: 'Active Incantations',
      description: 'Practice powerful affirmations to reinforce positive beliefs and mindset.',
      week: 1,
      image: require('../../assets/illustrations/challenges/active-incantations.png')
    },
    {
      id: 'passive-incantations',
      title: 'Passive Incantations',
      description: 'Listen to guided affirmations to reprogram your subconscious mind.',
      week: 1,
      image: require('../../assets/illustrations/challenges/passive-incantations.png')
    },
    {
      id: 'golden-checklist',
      title: 'Golden Checklist',
      description: 'Create and complete your daily checklist of important tasks and habits.',
      week: 1,
      image: require('../../assets/illustrations/challenges/golden-checklist.png')
    },
    {
      id: 'gratitude-beads',
      title: 'Gratitude Beads',
      description: 'Use meditation beads to practice mindful gratitude and positive thinking.',
      week: 2,
      image: require('../../assets/illustrations/challenges/gratitude-beads.png')
    },
    {
      id: 'sun-breath',
      title: 'Sun Breathe',
      description: 'Energize your body and mind with this powerful breathing technique.',
      week: 2,
      image: require('../../assets/illustrations/challenges/sun-breathe.png')
    },
    {
      id: 'vision-board',
      title: 'Vision Board',
      description: 'Create and visualize your goals and dreams through a digital vision board.',
      week: 2,
      image: require('../../assets/illustrations/challenges/vision-board.png')
    },
    {
      id: 'mentor-board',
      title: 'Mentor Board',
      description: 'Create your personal board of mentors to guide and inspire your journey.',
      week: 2,
      image: require('../../assets/illustrations/challenges/mentor-board.png')
    }
  ];

  const isAllExercisesCompleted = exercises.every(exercise => completedExercises[exercise.id]);

  useEffect(() => {
    if (!challenge) {
      return;
    }
    
    const loadChallengeState = async () => {
      try {
        // Check if we're coming from gratitude intro exit
        const exitingFromIntro = await AsyncStorage.getItem('exiting_gratitude_intro');
        if (exitingFromIntro === 'true') {
          // Clear the flag
          await AsyncStorage.removeItem('exiting_gratitude_intro');
          return;
        }

        // Check completion status for each exercise
        const completionPromises = exercises.map(exercise => 
          isChallengeExerciseCompleted(challenge.id, exercise.id)
        );
        
        const completionResults = await Promise.all(completionPromises);
        
        const newCompletedState = exercises.reduce((acc, exercise, index) => {
          acc[exercise.id] = completionResults[index];
          return acc;
        }, {} as Record<string, boolean>);
        
        setCompletedExercises(newCompletedState);
        challengeStateCache.current = {
          completionStatus: newCompletedState,
          lastUpdate: Date.now()
        };
        
        // Find last unlocked exercise
        for (let i = 0; i < exercises.length; i++) {
          if (!completionResults[i]) {
            setLastUnlockedExercise(exercises[i]);
            break;
          }
        }
      } catch (error) {
        console.error('Error loading challenge state:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadChallengeState);
    loadChallengeState(); // Initial load

    return unsubscribe;
  }, [challenge, navigation, exercises]);

  if (!challenge) {
    return null;
  }

  // Fonction pour générer les tabs de semaines en fonction de la durée
  const getWeekTabs = (duration: number) => {
    if (duration <= 7) return [];
    const numberOfWeeks = Math.min(4, Math.ceil(duration / 7));
    return Array.from({ length: numberOfWeeks }, (_, i) => ({
      label: `Week ${i + 1}`,
      value: i + 1
    }));
  };

  // Récupérer les tabs de semaines pour ce challenge
  const weekTabs = getWeekTabs(challenge.duration);

  const handleExerciseComplete = async (exerciseId: string) => {
    if (!challenge) return;
    
    try {
      await markChallengeExerciseAsCompleted(challenge.id, exerciseId);
      
      setCompletedExercises(prev => ({
        ...prev,
        [exerciseId]: true
      }));

      // Update last unlocked exercise
      const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
      const nextExercise = exercises[currentIndex + 1];
      if (nextExercise) {
        setLastUnlockedExercise(nextExercise);
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const isExerciseUnlocked = useCallback((exercise: Exercise): boolean => {
    const index = exercises.findIndex(ex => ex.id === exercise.id);
    if (index === 0) return true;
    return completedExercises[exercises[index - 1].id] === true;
  }, [exercises, completedExercises]);

  const handleExerciseStart = (exerciseId: string) => {
    const navigationParams = {
      returnTo: 'ChallengeDetail' as keyof RootStackParamList,
      challengeId: challenge.id,
      context: 'challenge' as const
    };

    type NavigationScreens = 
      | 'DeepBreathingIntro'
      | 'DailyGratitudeIntro'
      | 'ActiveIncantationsIntro'
      | 'PassiveIncantationsIntro'
      | 'GoldenChecklistIntro'
      | 'GratitudeBeadsIntro'
      | 'SunBreathTutorial'
      | 'VisionBoardIntro'
      | 'MentorBoardIntro';

    const navigationMap: Record<string, NavigationScreens> = {
      'deep-breathing': 'DeepBreathingIntro',
      'daily-gratitude': 'DailyGratitudeIntro',
      'active-incantations': 'ActiveIncantationsIntro',
      'passive-incantations': 'PassiveIncantationsIntro',
      'golden-checklist': 'GoldenChecklistIntro',
      'gratitude-beads': 'GratitudeBeadsIntro',
      'sun-breath': 'SunBreathTutorial',
      'vision-board': 'VisionBoardIntro',
      'mentor-board': 'MentorBoardIntro'
    };

    const screen = navigationMap[exerciseId];
    if (screen) {
      navigation.navigate(screen, navigationParams);
    }
  };

  const handleContinue = () => {
    if (lastUnlockedExercise) {
      handleExerciseStart(lastUnlockedExercise.id);
    }
  };

  const renderExerciseCard = (exercise: Exercise, index: number) => {
    const isCompleted = completedExercises[exercise.id];
    const isUnlocked = isExerciseUnlocked(exercise);
    const isCurrent = currentExercise?.id === exercise.id;

    return (
      <ExerciseCard
        key={exercise.id}
        {...exercise}
        challengeId={challenge.id}
        isCompleted={isCompleted}
        onComplete={() => handleExerciseStart(exercise.id)}
        index={index}
        isUnlocked={isUnlocked}
        isCurrent={isCurrent}
        image={exercise.image}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerButtonPlaceholder} />
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.push('MainTabs')}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <Image 
            source={typeof challenge.image === 'number' ? challenge.image : { uri: challenge.image }}
            style={styles.challengeImage}
            resizeMode="contain"
            defaultSource={require('../../assets/illustrations/challenges/challenge-21.png')}
          />
          <Text style={styles.title}>{challenge.title}</Text>
          <View style={styles.durationBadge}>
            <MaterialCommunityIcons name="layers" size={20} color="#FFFFFF" />
            <Text style={styles.durationText}>{challenge.duration} days</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.continueButton,
            isAllExercisesCompleted && styles.completedButton
          ]}
          onPress={handleContinue}
          disabled={isAllExercisesCompleted}
        >
          <Text style={[
            styles.continueButtonText,
            isAllExercisesCompleted && styles.completedButtonText
          ]}>
            {isAllExercisesCompleted ? 'Completed' : Object.values(completedExercises).some(completed => completed) ? 'Continue' : 'Start'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'trainings' && styles.activeTab]}
            onPress={() => setActiveTab('trainings')}
          >
            <Text style={[styles.tabText, activeTab === 'trainings' && styles.activeTabText]}>
              Trainings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
            onPress={() => setActiveTab('preview')}
          >
            <Text style={[styles.tabText, activeTab === 'preview' && styles.activeTabText]}>
              Preview
            </Text>
          </TouchableOpacity>
        </View>

        {/* Week selector - affiché uniquement si weekTabs n'est pas vide */}
        {weekTabs.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weekSelector}
          >
            {weekTabs.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.weekTab,
                  selectedWeek === tab.value && styles.selectedWeekTab
                ]}
                onPress={() => setSelectedWeek(tab.value)}
              >
                <Text style={[
                  styles.weekTabText,
                  selectedWeek === tab.value && styles.selectedWeekTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeTab === 'trainings' && (
          <ScrollView style={styles.exerciseList}>
            {exercises
              .filter(exercise => !weekTabs.length || exercise.week === selectedWeek)
              .map((exercise, index) => renderExerciseCard(exercise, index))}
          </ScrollView>
        )}

        {activeTab === 'preview' && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>{challenge.description}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  challengeImage: {
    width: width * 0.8,
    height: width * 0.6,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#FCD34D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#FCD34D33',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCD34D66',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueButtonTextDisabled: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.5,
  },
  completedButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 0,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FCD34D',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  weekSelector: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  weekTab: {
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedWeekTab: {
    borderBottomColor: '#FCD34D',
  },
  weekTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  selectedWeekTabText: {
    color: '#FCD34D',
  },
  exerciseList: {
    padding: 16,
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
  },
  previewContainer: {
    padding: 16,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 102, 102, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lockedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  startButtonLocked: {
    backgroundColor: 'rgba(102, 102, 102, 0.8)',
  },
  startButtonTextLocked: {
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  exerciseContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  exerciseCard: {
    backgroundColor: '#151932',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 300,
  },
  cardTopSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  exerciseBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cardBottomSection: {
    padding: 20,
    justifyContent: 'space-between',
    height: '100%',
    position: 'relative',
    zIndex: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'auto',
    backgroundColor: 'rgba(21, 25, 50, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  exerciseDescription: {
    fontSize: 15,
    color: '#FFFFFF',
    width: '100%',
    lineHeight: 22,
    fontWeight: '500',
    marginTop: 'auto',
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#FCD34D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChallengeDetailScreen; 