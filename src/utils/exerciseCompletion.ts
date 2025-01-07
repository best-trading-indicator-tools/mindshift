import AsyncStorage from '@react-native-async-storage/async-storage';

// Separate key prefixes for different contexts
const DAILY_COMPLETION_KEY_PREFIX = '@daily_exercise_completion:';
const CHALLENGE_COMPLETION_KEY_PREFIX = '@challenge_exercise_completion:';

interface ExerciseCompletion {
  exerciseId: string;
  completedAt: string;
  context: 'daily' | 'challenge';
  challengeId?: string; // Only present for challenge exercises
}

// For daily/carousel exercises
export const markDailyExerciseAsCompleted = async (exerciseId: string): Promise<void> => {
  try {
    const key = `${DAILY_COMPLETION_KEY_PREFIX}${exerciseId}`;
    const completion: ExerciseCompletion = {
      exerciseId,
      completedAt: new Date().toISOString(),
      context: 'daily'
    };
    await AsyncStorage.setItem(key, JSON.stringify(completion));
  } catch (error) {
    console.error('Error marking daily exercise as completed:', error);
  }
};

export const isDailyExerciseCompleted = async (exerciseId: string): Promise<boolean> => {
  try {
    const key = `${DAILY_COMPLETION_KEY_PREFIX}${exerciseId}`;
    const completion = await AsyncStorage.getItem(key);
    return completion !== null;
  } catch (error) {
    console.error('Error checking daily exercise completion:', error);
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