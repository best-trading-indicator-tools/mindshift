import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Text } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isChallengeExerciseCompleted, markChallengeExerciseAsCompleted } from '../../utils/exerciseCompletion';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;

type TabType = 'trainings' | 'preview';

interface Exercise {
  id: string;
  title: string;
  description: string;
}

const ExerciseCard: React.FC<Exercise & { challengeId: string; isCompleted: boolean; onComplete: () => void }> = ({ 
  id, 
  title, 
  description, 
  isCompleted,
  onComplete 
}) => (
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
      </View>
      <Text style={styles.exerciseDescription}>{description}</Text>
      <TouchableOpacity 
        style={styles.startButton}
        onPress={onComplete}
      >
        <Text style={styles.startButtonText}>
          {isCompleted ? 'Restart Training' : 'Start Training'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ChallengeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('trainings');
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  
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
    {
      id: 'deep-breathing',
      title: 'Deep Breathing',
      description: 'Practice deep breathing exercises to reduce stress and increase mindfulness.',
    },
    {
      id: 'daily-gratitude',
      title: 'Daily Gratitude',
      description: 'Express gratitude for three things in your life to cultivate positivity and appreciation.',
    },
    {
      id: 'active-incantations',
      title: 'Active Incantations',
      description: 'Practice powerful affirmations to reinforce positive beliefs and mindset.',
    },
    {
      id: 'passive-incantations',
      title: 'Passive Incantations',
      description: 'Listen to guided affirmations with background music to reprogram your subconscious mind.',
    },
    {
      id: 'golden-checklist',
      title: 'Golden Checklist',
      description: 'Create and complete your daily checklist of important tasks and habits.',
    },
    {
      id: 'gratitude-beads',
      title: 'Gratitude Beads',
      description: 'Use meditation beads to practice mindful gratitude and positive thinking.',
    },
    {
      id: 'sun-breath',
      title: 'Sun Breath',
      description: 'Energize your body and mind with this powerful breathing technique.',
    },
    {
      id: 'vision-board',
      title: 'Vision Board',
      description: 'Create and visualize your goals and dreams through a digital vision board.',
    },
    {
      id: 'mentor-board',
      title: 'Mentor Board',
      description: 'Create your personal board of mentors to guide and inspire your journey.',
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

    loadCompletionStatus();
  }, [challenge.id, exercises]);

  const handleExerciseComplete = async (exerciseId: string) => {
    await markChallengeExerciseAsCompleted(challenge.id, exerciseId);
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: true
    }));
  };

  const handleExerciseStart = async (exerciseId: string) => {
    const navigationParams = {
      onComplete: () => handleExerciseComplete(exerciseId),
      returnTo: 'ChallengeDetail' as keyof RootStackParamList,
      challengeId: challenge.id
    };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <Image 
            source={challenge.image}
            style={styles.challengeImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>{challenge.title}</Text>
          <View style={styles.durationBadge}>
            <MaterialCommunityIcons name="layers" size={20} color="#FFFFFF" />
            <Text style={styles.durationText}>{challenge.duration} days</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton}>
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
                <View 
                  key={week.id} 
                  style={styles.weekItem}
                >
                  <View style={[
                    styles.weekDot,
                    index === 0 && styles.activeWeekDot
                  ]} />
                  <Text style={[
                    styles.weekText,
                    index === 0 && styles.activeWeekText
                  ]}>Week {week.id}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.exercisesContainer}>
              {exercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  {...exercise}
                  challengeId={challenge.id}
                  isCompleted={completedExercises[exercise.id] || false}
                  onComplete={() => handleExerciseStart(exercise.id)}
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
    padding: 8,
  },
  closeButton: {
    padding: 8,
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
});

export default ChallengeDetailScreen; 