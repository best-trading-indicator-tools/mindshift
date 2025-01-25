import AsyncStorage from '@react-native-async-storage/async-storage';
import { addNotification } from '../services/notificationService';
import { addPoints, updateDailyStreak, checkAndUpdateAchievements } from '../services/achievementService';

// Separate key prefixes for different contexts
const DAILY_COMPLETION_KEY_PREFIX = '@daily_exercise_completion:';
const CHALLENGE_COMPLETION_KEY_PREFIX = '@challenge_exercise_completion:';
const CAROUSEL_COMPLETION_KEY_PREFIX = '@carousel_exercise_completion:';

interface ExerciseCompletion {
  exerciseId: string;
  completedAt: string;
  context: 'daily' | 'challenge' | 'carousel';
  challengeId?: string; // Only present for challenge exercises
}

// For daily/carousel exercises
export const markDailyExerciseAsCompleted = async (exerciseId: string): Promise<void> => {
  try {
    // Mark completion in new format
    const key = `${DAILY_COMPLETION_KEY_PREFIX}${exerciseId}`;
    const completion: ExerciseCompletion = {
      exerciseId,
      completedAt: new Date().toISOString(),
      context: 'daily'
    };
    await AsyncStorage.setItem(key, JSON.stringify(completion));

    // Also mark completion in old format for exerciseService.ts
    const today = new Date();
    const completionsJson = await AsyncStorage.getItem('exercise_completions');
    const completions = completionsJson ? JSON.parse(completionsJson) : {};
    
    completions[exerciseId] = {
      date: today.toDateString(),
      exerciseName: exerciseId,
      completedAt: today.toISOString()
    };
    
    await AsyncStorage.setItem('exercise_completions', JSON.stringify(completions));

    // Get all selected daily missions and their completion status
    const storedMissions = await AsyncStorage.getItem('selectedDailyMissions');
    if (storedMissions) {
      const missions = JSON.parse(storedMissions);
      const completedMissions = await Promise.all(
        missions.map((mission: any) => isDailyExerciseCompleted(
          mission.title === 'Deep Breathing' 
            ? 'deep-breathing'
            : mission.title === 'Active Incantations'
            ? 'active-incantations'
            : mission.title === 'Passive Incantations'
            ? 'passive-incantations'
            : mission.title === 'Daily Gratitude'
            ? 'daily-gratitude'
            : mission.title === 'Golden Checklist'
            ? 'golden-checklist'
            : mission.title === 'Gratitude Beads'
            ? 'gratitude-beads'
            : mission.title === 'The Sun Breath'
            ? 'sun-breath'
            : mission.title === 'Self-Hypnosis'
            ? 'self-hypnosis'
            : ''
        ))
      );

      const completedCount = completedMissions.filter(Boolean).length;
      const totalMissions = missions.length;

      // Add notification for daily exercise completion with progress
      await addNotification({
        id: `daily-${exerciseId}-${Date.now()}`,
        title: '⭐ Daily Exercise Completed',
        message: `Great progress! You've completed ${completedCount} out of ${totalMissions} daily missions. Keep going!`,
        type: 'success'
      });

      // If all daily missions are completed, send a special notification
      if (completedCount === totalMissions) {
        await addNotification({
          id: `daily-complete-${Date.now()}`,
          title: '🏆 Daily Missions Completed!',
          message: 'Congratulations! You\'ve completed all your daily missions. Your dedication is inspiring!',
          type: 'success'
        });
      }
    }
  } catch (error) {
    console.error('Error marking daily exercise as completed:', error);
  }
};

export const isDailyExerciseCompleted = async (exerciseId: string): Promise<boolean> => {
  try {
        // Use the same key format as markDailyExerciseAsCompleted
      const key = `${DAILY_COMPLETION_KEY_PREFIX}${exerciseId}`;
      const completion = await AsyncStorage.getItem(key);
      return completion !== null;
  } catch (error) {
    console.error('Error checking exercise completion:', error);
    return false;
  }
};

// For challenge exercises
export const markChallengeExerciseAsCompleted = async (challengeId: string, exerciseId: string): Promise<void> => {
  try {
    const key = `${CHALLENGE_COMPLETION_KEY_PREFIX}${challengeId}:${exerciseId}`;
    const completion: ExerciseCompletion = {
      exerciseId,
      completedAt: new Date().toISOString(),
      context: 'challenge',
      challengeId
    };
    await AsyncStorage.setItem(key, JSON.stringify(completion));

    // Get challenge progress after marking this exercise as completed
    const progress = await getChallengeProgress(challengeId);

    // Add notification for challenge exercise completion
    await addNotification({
      id: `challenge-${challengeId}-${exerciseId}-${Date.now()}`,
      title: '⭐ Challenge Exercise Completed',
      message: `Great progress! You've completed ${progress.completedCount} out of ${progress.totalExercises} exercises in this challenge. Keep pushing!`,
      type: 'success'
    });

    // If all exercises are completed, send a special notification and add points
    if (progress.completedCount === progress.totalExercises) {
      await addNotification({
        id: `challenge-${challengeId}-complete-${Date.now()}`,
        title: '🏆 Challenge Completed!',
        message: 'Congratulations! You\'ve completed all exercises in this challenge. Your dedication is truly inspiring!',
        type: 'success'
      });
      
      // Add points and check for achievements when challenge is completed
      await addPoints('CHALLENGE');
      await checkAndUpdateAchievements(0); // Pass 0 as we're not checking streak achievements
    }
  } catch (error) {
    console.error('Error marking challenge exercise as completed:', error);
  }
};

export const isChallengeExerciseCompleted = async (challengeId: string, exerciseId: string): Promise<boolean> => {
  try {
    const key = `${CHALLENGE_COMPLETION_KEY_PREFIX}${challengeId}:${exerciseId}`;
    const completion = await AsyncStorage.getItem(key);
    return completion !== null;
  } catch (error) {
    console.error('Error checking challenge exercise completion:', error);
    return false;
  }
};

// Generic getter for exercise completion details
export const getExerciseCompletion = async (
  exerciseId: string, 
  context: 'daily' | 'challenge', 
  challengeId?: string
): Promise<ExerciseCompletion | null> => {
  try {
    const key = context === 'daily' 
      ? `${DAILY_COMPLETION_KEY_PREFIX}${exerciseId}`
      : `${CHALLENGE_COMPLETION_KEY_PREFIX}${challengeId}:${exerciseId}`;
    
    const completion = await AsyncStorage.getItem(key);
    return completion ? JSON.parse(completion) : null;
  } catch (error) {
    console.error('Error getting exercise completion:', error);
    return null;
  }
};

// Get total number of exercises in each challenge
const CHALLENGE_EXERCISES = {
  '1': 9, // Ultimate challenge (21 days)
  '2': 14 // Deep Mind Programming challenge (7 days)
};

// Get challenge progress
export const getChallengeProgress = async (challengeId: string): Promise<{
  completedCount: number;
  totalExercises: number;
  progressPercentage: number;
}> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const challengeKeys = allKeys.filter(key => 
      key.startsWith(`${CHALLENGE_COMPLETION_KEY_PREFIX}${challengeId}:`)
    );
    
    const completedCount = challengeKeys.length;
    const totalExercises = CHALLENGE_EXERCISES[challengeId as keyof typeof CHALLENGE_EXERCISES] || 9;
    const progressPercentage = Math.round((completedCount / totalExercises) * 100);

    return {
      completedCount,
      totalExercises,
      progressPercentage
    };
  } catch (error) {
    console.error('Error getting challenge progress:', error);
    return {
      completedCount: 0,
      totalExercises: CHALLENGE_EXERCISES[challengeId as keyof typeof CHALLENGE_EXERCISES] || 9,
      progressPercentage: 0
    };
  }
};

// Get all completed exercises for a challenge in chronological order
export const getCompletedChallengeExercises = async (challengeId: string): Promise<ExerciseCompletion[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const challengeKeys = allKeys.filter(key => 
      key.startsWith(`${CHALLENGE_COMPLETION_KEY_PREFIX}${challengeId}:`)
    );
    
    const completions = await Promise.all(
      challengeKeys.map(async key => {
        const completion = await AsyncStorage.getItem(key);
        return completion ? JSON.parse(completion) : null;
      })
    );

    return completions
      .filter((completion): completion is ExerciseCompletion => completion !== null)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  } catch (error) {
    console.error('Error getting completed challenge exercises:', error);
    return [];
  }
};

// Check if a challenge exercise is unlocked based on previous exercise completion
export const isChallengeExerciseUnlocked = async (challengeId: string, exerciseId: string, exerciseIndex: number): Promise<boolean> => {
  try {
    // First exercise is always unlocked
    if (exerciseIndex === 0) {
      return true;
    }

    // Get the previous exercise ID from the exercises array
    const exercises = [
      'deep-breathing',
      'daily-gratitude',
      'active-incantations',
      'passive-incantations',
      'golden-checklist',
      'gratitude-beads',
      'sun-breath',
      'vision-board',
      'mentor-board'
    ];

    // For other exercises, check if the previous exercise is completed
    const previousExerciseId = exercises[exerciseIndex - 1];
    const isPreviousCompleted = await isChallengeExerciseCompleted(challengeId, previousExerciseId);
    return isPreviousCompleted;
  } catch (error) {
    console.error('Error checking if challenge exercise is unlocked:', error);
    return false;
  }
};

export async function markExerciseCompleted(exerciseKey: string, isChallenge: boolean = false) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const completionKey = `${exerciseKey}_completion_${today}`;
    
    // Only award points if not already completed today
    const alreadyCompleted = await isDailyExerciseCompleted(exerciseKey);
    if (!alreadyCompleted) {
      await AsyncStorage.setItem(completionKey, 'true');
      
      // Award points and update streak
      await addPoints(isChallenge ? 'CHALLENGE' : 'DAILY_MISSION');
      await updateDailyStreak();
    }
  } catch (error) {
    console.error('Error marking exercise completion:', error);
  }
}

export async function getAllCompletedExercises(): Promise<string[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const keys = await AsyncStorage.getAllKeys();
    const completedExercises = keys
      .filter(key => key.endsWith(`_completion_${today}`))
      .map(key => key.split('_completion_')[0]);
    return completedExercises;
  } catch (error) {
    console.error('Error getting completed exercises:', error);
    return [];
  }
}

// For carousel exercises
export const markCarouselExerciseAsCompleted = async (exerciseId: string): Promise<void> => {
  try {
    const key = `${CAROUSEL_COMPLETION_KEY_PREFIX}${exerciseId}`;
    const completion: ExerciseCompletion = {
      exerciseId,
      completedAt: new Date().toISOString(),
      context: 'carousel'
    };
    await AsyncStorage.setItem(key, JSON.stringify(completion));

    // Add notification for carousel exercise completion
    await addNotification({
      id: `carousel-${exerciseId}-${Date.now()}`,
      title: '🎯 Exercise Completed',
      message: 'Great job! You\'ve completed this exercise. Keep exploring and growing!',
      type: 'success'
    });

    // Add points when carousel exercise is completed
    await addPoints('DAILY_MISSION');
    await checkAndUpdateAchievements(0);
  } catch (error) {
    console.error('Error marking carousel exercise as completed:', error);
  }
}; 