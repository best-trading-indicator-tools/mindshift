import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addNotification } from './notificationService';
import firestore from '@react-native-firebase/firestore';

export const EXERCISE_COMPLETION_KEY = 'exercise_completions';

export type ExerciseType = 
  | 'deep-breathing'
  | 'active-incantations'
  | 'passive-incantations'
  | 'voix-nasale'
  | 'fry-vocal'
  | 'gratitude'
  | 'gratitude-beads'
  | 'golden-checklist'
  | 'vision-board'
  | 'sun-breath';

export interface ExerciseCompletion {
  exerciseId: string;
  exerciseName: string;
  completedAt: string;
}

export const markExerciseAsCompleted = async (exerciseId: string, exerciseName: string): Promise<boolean> => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Get existing completions
    const completionsJson = await AsyncStorage.getItem(EXERCISE_COMPLETION_KEY);
    const completions = completionsJson ? JSON.parse(completionsJson) : {};
    
    // Update completions with new exercise
    completions[exerciseId] = {
      date: today.toDateString(),
      exerciseName,
      completedAt: today.toISOString()
    };
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem(EXERCISE_COMPLETION_KEY, JSON.stringify(completions));
    
    return true;
  } catch (error) {
    console.error('Error marking exercise as completed:', error);
    return false;
  }
};

export const isExerciseCompletedToday = async (exerciseId: string): Promise<boolean> => {
  try {
    const today = new Date().toDateString();
    const completionsJson = await AsyncStorage.getItem(EXERCISE_COMPLETION_KEY);
    const completions = completionsJson ? JSON.parse(completionsJson) : {};
    return completions[exerciseId]?.date === today;
  } catch (error) {
    console.error('Error checking exercise completion:', error);
    return false;
  }
};

const STREAK_KEY = 'exercise_streak';
const LAST_COMPLETION_KEY = 'last_completion_date';

export const updateStreak = async () => {
  try {
    // Check if all exercises are completed today
    const results = await Promise.all([
      isExerciseCompletedToday('deep-breathing'),
      isExerciseCompletedToday('active-incantations'),
      isExerciseCompletedToday('passive-incantations'),
      isExerciseCompletedToday('gratitude'),
      isExerciseCompletedToday('golden-checklist'),
    ]);

    const allCompleted = results.every(result => result);
    if (!allCompleted) return;

    // Get the current streak and last completion date
    const streakStr = await AsyncStorage.getItem(STREAK_KEY);
    const lastCompletionStr = await AsyncStorage.getItem(LAST_COMPLETION_KEY);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastCompletion = lastCompletionStr ? new Date(lastCompletionStr) : null;
    let streak = streakStr ? parseInt(streakStr) : 0;

    if (!lastCompletion) {
      // First time completing all exercises
      streak = 1;
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCompletion.getTime() === yesterday.getTime()) {
        // Completed yesterday, increment streak
        streak += 1;
      } else if (lastCompletion.getTime() < yesterday.getTime()) {
        // Missed a day, reset streak
        streak = 1;
      }
    }

    // Save the new streak and completion date
    await AsyncStorage.setItem(STREAK_KEY, streak.toString());
    await AsyncStorage.setItem(LAST_COMPLETION_KEY, today.toISOString());
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

export const getStreak = async (): Promise<number> => {
  try {
    const streakStr = await AsyncStorage.getItem(STREAK_KEY);
    return streakStr ? parseInt(streakStr) : 0;
  } catch (error) {
    console.error('Error getting streak:', error);
    return 0;
  }
};

interface DailyMission {
  title: string;
  subtitle: string;
  duration: string;
  type: string;
  icon: string;
}

interface MissionKey {
  key: string;
  name: string;
}

export const checkDailyProgress = async () => {
  try {
    // Get today's selected missions
    const storedMissions = await AsyncStorage.getItem('selectedDailyMissions');
    if (!storedMissions) {
      return { completedCount: 0, totalMissions: 0, remainingMissions: 0, progressPercentage: 0 };
    }

    const missions = JSON.parse(storedMissions).map((mission: DailyMission) => ({
      key: mission.title === 'Deep Breathing' 
        ? 'deep-breathing'
        : mission.title === 'Active Incantations'
        ? 'active-incantations'
        : mission.title === 'Passive Incantations'
        ? 'passive-incantations'
        : mission.title === 'Daily Gratitude'
        ? 'gratitude'
        : mission.title === 'Golden Checklist'
        ? 'golden-checklist'
        : mission.title === 'Gratitude Beads'
        ? 'gratitude-beads'
        : mission.title === 'The Sun Breath'
        ? 'sun-breath'
        : '',
      name: mission.title
    }));

    const results = await Promise.all(
      missions.map((mission: MissionKey) => isExerciseCompletedToday(mission.key))
    );

    const completedCount = results.filter(Boolean).length;
    const totalMissions = missions.length;
    const remainingMissions = totalMissions - completedCount;
    const progressPercentage = Math.round((completedCount / totalMissions) * 100);

    // Get the last known completed count
    const lastCompletedJson = await AsyncStorage.getItem('last_completed_count');
    const lastCompleted = lastCompletedJson ? parseInt(lastCompletedJson) : 0;

    // Update last completed count if all missions are completed
    if (completedCount === totalMissions && lastCompleted < totalMissions) {
      await AsyncStorage.setItem('last_completed_count', completedCount.toString());
    }

    // Store the progress percentage for UI updates
    await AsyncStorage.setItem('daily_progress', progressPercentage.toString());

    return { completedCount, totalMissions, remainingMissions, progressPercentage };
  } catch (error) {
    console.error('Error checking daily progress:', error);
    return { completedCount: 0, totalMissions: 0, remainingMissions: 0, progressPercentage: 0 };
  }
};

export const resetAllDailyExercises = async () => {
  try {
    // Reset exercise completions
    await AsyncStorage.setItem(EXERCISE_COMPLETION_KEY, JSON.stringify({}));
    
    // Reset completion count and progress
    await AsyncStorage.setItem('last_completed_count', '0');
    await AsyncStorage.setItem('daily_progress', '0');
    
    // Reset streak data
    await AsyncStorage.setItem(STREAK_KEY, '0');
    await AsyncStorage.removeItem(LAST_COMPLETION_KEY);
    
    // Reset golden checklist items
    const todayISOString = new Date().toISOString().split('T')[0];
    await AsyncStorage.removeItem(`checklist_${todayISOString}`);
    
    // Clear all challenge completions
    const allKeys = await AsyncStorage.getAllKeys();
    const challengeKeys = allKeys.filter(key => key.startsWith('@challenge_exercise_completion:'));
    if (challengeKeys.length > 0) {
      await AsyncStorage.multiRemove(challengeKeys);
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting daily exercises:', error);
    return false;
  }
};

export const clearAllAppData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
}; 