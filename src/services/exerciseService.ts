import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addNotification } from './notificationService';

const EXERCISE_COMPLETION_KEY = 'exercise_completions';

export type ExerciseType = 
  | 'deep-breathing'
  | 'active-incantations'
  | 'passive-incantations'
  | 'voix-nasale'
  | 'fry-vocal'
  | 'gratitude'
  | 'golden-checklist';

export interface ExerciseCompletion {
  userId: string;
  exerciseType: string;
  completedAt: Date;
}

const getStorageKey = (exerciseType: string, date: Date) => {
  const userId = auth().currentUser?.uid || 'local-user';
  return `exercise_${userId}_${exerciseType}_${date.toISOString().split('T')[0]}`;
};

export const markExerciseAsCompleted = async (exerciseId: string, exerciseName: string) => {
  try {
    const today = new Date().toDateString();
    const completionsJson = await AsyncStorage.getItem(EXERCISE_COMPLETION_KEY);
    const completions = completionsJson ? JSON.parse(completionsJson) : {};
    
    // Check if already completed today before doing anything
    if (completions[exerciseId]?.date === today) {
      return true; // Already completed today, just return success
    }

    // If not completed today, add notification and update completion
    await addNotification({
      id: `completion-${exerciseId}-${Date.now()}`,
      title: 'Well Done!',
      message: `You've completed your ${exerciseName} exercise. Keep up the great work!`,
      type: 'success'
    });

    // Update completion status
    completions[exerciseId] = { date: today };
    await AsyncStorage.setItem(EXERCISE_COMPLETION_KEY, JSON.stringify(completions));
    
    // Check overall daily progress after marking exercise as complete
    await checkDailyProgress();
    
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

export const checkDailyProgress = async () => {
  try {
    const missions = [
      { key: 'deep-breathing', name: 'Deep Breathing' },
      { key: 'active-incantations', name: 'Active Incantations' },
      { key: 'passive-incantations', name: 'Passive Incantations' },
      { key: 'gratitude', name: 'Daily Gratitude' },
      { key: 'golden-checklist', name: 'Golden Checklist' }
    ];

    const results = await Promise.all(
      missions.map(mission => isExerciseCompletedToday(mission.key))
    );

    const completedCount = results.filter(Boolean).length;
    const totalMissions = missions.length;
    const remainingMissions = totalMissions - completedCount;
    const progressPercentage = Math.round((completedCount / totalMissions) * 100);

    // Only send reminder if there are completed missions but some are still remaining
    if (completedCount > 0 && remainingMissions > 0) {
      await addNotification({
        id: `daily-reminder-${Date.now()}`,
        title: 'Daily Progress',
        message: `You've completed ${completedCount} out of ${totalMissions} missions today. Keep going!`,
        type: 'reminder'
      });
    }

    if (completedCount === totalMissions) {
      await addNotification({
        id: `all-complete-${Date.now()}`,
        title: 'Outstanding!',
        message: "You've completed all your daily missions! Your dedication is inspiring. Keep up the great work!",
        type: 'success'
      });
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
    const today = new Date().toDateString();
    // Reset exercise completions
    await AsyncStorage.setItem(EXERCISE_COMPLETION_KEY, JSON.stringify({}));
    
    // Reset golden checklist items
    const todayISOString = new Date().toISOString().split('T')[0];
    await AsyncStorage.removeItem(`checklist_${todayISOString}`);
    
    console.log('Successfully reset all daily exercises');
    return true;
  } catch (error) {
    console.error('Error resetting daily exercises:', error);
    return false;
  }
}; 