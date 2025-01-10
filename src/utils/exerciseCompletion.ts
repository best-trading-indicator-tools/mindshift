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

// Get total number of exercises in the challenge
const TOTAL_CHALLENGE_EXERCISES = 9; // Total number of exercises in the 21-day challenge

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
    const progressPercentage = Math.round((completedCount / TOTAL_CHALLENGE_EXERCISES) * 100);

    return {
      completedCount,
      totalExercises: TOTAL_CHALLENGE_EXERCISES,
      progressPercentage
    };
  } catch (error) {
    console.error('Error getting challenge progress:', error);
    return {
      completedCount: 0,
      totalExercises: TOTAL_CHALLENGE_EXERCISES,
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