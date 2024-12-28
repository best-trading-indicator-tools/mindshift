import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExerciseType = 
  | 'deep-breathing'
  | 'active-incantations'
  | 'passive-incantations'
  | 'meditation'
  | 'gratitude'
  | 'visualization';

export interface ExerciseCompletion {
  userId: string;
  exerciseType: string;
  completedAt: Date;
}

const getStorageKey = (exerciseType: string, date: Date) => {
  const userId = auth().currentUser?.uid || 'local-user';
  return `exercise_${userId}_${exerciseType}_${date.toISOString().split('T')[0]}`;
};

export const markExerciseAsCompleted = async (exerciseType: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const storageKey = getStorageKey(exerciseType, today);
  const completion: ExerciseCompletion = {
    userId: auth().currentUser?.uid || 'local-user',
    exerciseType,
    completedAt: today
  };

  await AsyncStorage.setItem(storageKey, JSON.stringify(completion));
  await updateStreak();
};

export const isExerciseCompletedToday = async (exerciseType: string): Promise<boolean> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const storageKey = getStorageKey(exerciseType, today);
  const completion = await AsyncStorage.getItem(storageKey);
  
  return completion !== null;
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
    ]);

    console.log('Exercise completion results:', results);
    const allCompleted = results.every(result => result);
    console.log('All exercises completed?', allCompleted);
    if (!allCompleted) return;

    // Get the current streak and last completion date
    const streakStr = await AsyncStorage.getItem(STREAK_KEY);
    const lastCompletionStr = await AsyncStorage.getItem(LAST_COMPLETION_KEY);
    
    console.log('Current streak from storage:', streakStr);
    console.log('Last completion date:', lastCompletionStr);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastCompletion = lastCompletionStr ? new Date(lastCompletionStr) : null;
    let streak = streakStr ? parseInt(streakStr) : 0;

    if (!lastCompletion) {
      // First time completing all exercises
      streak = 1;
      console.log('First time completion, setting streak to:', streak);
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCompletion.getTime() === yesterday.getTime()) {
        // Completed yesterday, increment streak
        streak += 1;
        console.log('Completed yesterday, incrementing streak to:', streak);
      } else if (lastCompletion.getTime() < yesterday.getTime()) {
        // Missed a day, reset streak
        streak = 1;
        console.log('Missed a day, resetting streak to:', streak);
      } else {
        console.log('Already completed today, keeping streak at:', streak);
      }
    }

    // Save the new streak and completion date
    await AsyncStorage.setItem(STREAK_KEY, streak.toString());
    await AsyncStorage.setItem(LAST_COMPLETION_KEY, today.toISOString());
    console.log('Saved new streak:', streak);
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