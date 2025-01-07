import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Text } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isChallengeExerciseCompleted, markChallengeExerciseAsCompleted, isChallengeExerciseUnlocked } from '../../utils/exerciseCompletion';
import { addNotification } from '../../services/notificationService';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;

type TabType = 'trainings' | 'preview';

interface Exercise {
  id: string;
  title: string;
  description: string;
  week: number;
}

const ExerciseCard: React.FC<Exercise & { 
  challengeId: string; 
  isCompleted: boolean; 
  onComplete: () => void;
  index: number;
}> = ({ 
  id, 
  title, 
  description, 
  isCompleted,
  onComplete,
  challengeId,
  index
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const checkUnlockStatus = async () => {
      const unlocked = await isChallengeExerciseUnlocked(challengeId, id, index);
      setIsUnlocked(unlocked);
    };
    checkUnlockStatus();
  }, [challengeId, id, index, isCompleted]);

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseContent}>
        <View style={styles.exerciseHeader}>
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
  );
};

const ChallengeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('trainings');
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [lastUnlockedExercise, setLastUnlockedExercise] = useState<Exercise | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState<string | null>(null);
  
  if (!route.params?.challenge) {
    return null;
  }
  
  const { challenge } = route.params;

  const weeks = [
    { id: 1, title: 'Week 1' },
    { id: 2, title: 'Week 2' },
    { id: 3, title: 'Week 3' },
    { id: 4, title: 'Week 4' },
  ];

  const exercises: Exercise[] = [
    // Week 1 Exercises
    {
      id: 'deep-breathing',
      title: 'Deep Breathing',
      description: 'Practice deep breathing exercises to reduce stress and increase mindfulness.',
      week: 1
    },
    {
      id: 'daily-gratitude',
      title: 'Daily Gratitude',
      description: 'Express gratitude for three things in your life to cultivate positivity and appreciation.',
      week: 1
    },
    {
      id: 'active-incantations',
      title: 'Active Incantations',
      description: 'Practice powerful affirmations to reinforce positive beliefs and mindset.',
      week: 1
    },
    {
      id: 'passive-incantations',
      title: 'Passive Incantations',
      description: 'Listen to guided affirmations with background music to reprogram your subconscious mind.',
      week: 1
    },
    {
      id: 'golden-checklist',
      title: 'Golden Checklist',
      description: 'Create and complete your daily checklist of important tasks and habits.',
      week: 1
    },
    // Week 2 Exercises
    {
      id: 'gratitude-beads',
      title: 'Gratitude Beads',
      description: 'Use meditation beads to practice mindful gratitude and positive thinking.',
      week: 2
    },
    {
      id: 'sun-breath',
      title: 'Sun Breath',
      description: 'Energize your body and mind with this powerful breathing technique.',
      week: 2
    },
    {
      id: 'vision-board',
      title: 'Vision Board',
      description: 'Create and visualize your goals and dreams through a digital vision board.',
      week: 2
    },
    {
      id: 'mentor-board',
      title: 'Mentor Board',
      description: 'Create your personal board of mentors to guide and inspire your journey.',
      week: 2
    }
  ];

  useEffect(() => {
    // Load completion status for all exercises
    const loadCompletionStatus = async () => {
      const completionStatus: Record<string, boolean> = {};
      await Promise.all(
        exercises.map(async (exercise) => {
          completionStatus[exercise.id] = await isChallengeExerciseCompleted(challenge.id, exercise.id);
        })
      );
      setCompletedExercises(completionStatus);
    };

    // Find last unlocked exercise
    const findLastUnlockedExercise = async () => {
      for (let i = exercises.length - 1; i >= 0; i--) {
        const isUnlocked = await isChallengeExerciseUnlocked(challenge.id, exercises[i].id, i);
        if (isUnlocked) {
          setLastUnlockedExercise(exercises[i]);
          break;
        }
      }
    };

    loadCompletionStatus();
    findLastUnlockedExercise();
  }, [challenge.id, exercises]);

  useEffect(() => {
    // Handle pending completion when navigation focuses
    const unsubscribe = navigation.addListener('focus', () => {
      if (pendingCompletion) {
        handleExerciseComplete(pendingCompletion);
        setPendingCompletion(null);
      }
    });

    return unsubscribe;
  }, [navigation, pendingCompletion]);

  const handleExerciseComplete = async (exerciseId: string) => {
    try {
      await markChallengeExerciseAsCompleted(challenge.id, exerciseId);
      setCompletedExercises(prev => ({
        ...prev,
        [exerciseId]: true
      }));
    } catch (error) {
      console.error('Error marking exercise as completed:', error);
    }
  };

  const handleExerciseStart = async (exerciseId: string) => {
    const navigationParams = {
      returnTo: 'ChallengeDetail' as keyof RootStackParamList,
      challengeId: challenge.id,
      context: 'challenge' as const
    };

    // Set the pending completion before navigating
    setPendingCompletion(exerciseId);

    // Navigate to the appropriate exercise screen based on the exercise ID
    switch (exerciseId) {
      case 'deep-breathing':
        navigation.navigate('DeepBreathingIntro', navigationParams);
        break;
      case 'daily-gratitude':
        navigation.navigate('DailyGratitudeIntro', navigationParams);
        break;
      case 'active-incantations':
        navigation.navigate('ActiveIncantationsIntro', navigationParams);
        break;
      case 'passive-incantations':
        navigation.navigate('PassiveIncantationsIntro', navigationParams);
        break;
      case 'golden-checklist':
        navigation.navigate('GoldenChecklistIntro', navigationParams);
        break;
      case 'gratitude-beads':
        navigation.navigate('GratitudeBeadsIntro', navigationParams);
        break;
      case 'sun-breath':
        navigation.navigate('SunBreathTutorial', navigationParams);
        break;
      case 'vision-board':
        navigation.navigate('VisionBoardIntro', navigationParams);
        break;
      case 'mentor-board':
        navigation.navigate('MentorBoardIntro', navigationParams);
        break;
    }
  };

  const handleContinue = () => {
    if (lastUnlockedExercise) {
      handleExerciseStart(lastUnlockedExercise.id);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            !lastUnlockedExercise && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!lastUnlockedExercise}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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

        {activeTab === 'trainings' && (
          <>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.weeksContainer}
            >
              {weeks.map((week, index) => (
                <TouchableOpacity 
                  key={week.id} 
                  style={styles.weekItem}
                  onPress={() => setSelectedWeek(week.id)}
                >
                  <View style={[
                    styles.weekDot,
                    selectedWeek === week.id && styles.activeWeekDot
                  ]} />
                  <Text style={[
                    styles.weekText,
                    selectedWeek === week.id && styles.activeWeekText
                  ]}>Week {week.id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.exercisesContainer}>
              {exercises
                .filter(exercise => exercise.week === selectedWeek)
                .map((exercise, index) => (
                  <ExerciseCard
                    key={exercise.id}
                    {...exercise}
                    challengeId={challenge.id}
                    isCompleted={completedExercises[exercise.id] || false}
                    onComplete={() => handleExerciseStart(exercise.id)}
                    index={index}
                  />
                ))}
            </View>
          </>
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
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
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
  weeksContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  weekItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
  },
  activeWeekDot: {
    backgroundColor: '#FCD34D',
  },
  weekText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  activeWeekText: {
    color: '#FCD34D',
  },
  exercisesContainer: {
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: '#151932',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  exerciseContent: {
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#FCD34D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#666666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  startButtonLocked: {
    backgroundColor: '#666666',
  },
  startButtonTextLocked: {
    color: '#999999',
  },
  continueButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
});

export default ChallengeDetailScreen; 