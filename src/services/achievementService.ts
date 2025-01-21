import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface UserStats {
  consecutiveDays: number;
  totalPoints: number;
  totalChallenges: number;
  lastActiveDate?: string;
}

export const STREAK_ACHIEVEMENTS = [
  {
    id: 'streak_1',
    title: 'First Day',
    description: 'Completed daily missions for 1 day',
    icon: 'trophy',
    color: '#4CAF50', // Green
    requiredDays: 1
  },
  {
    id: 'streak_3',
    title: 'Beginner',
    description: 'Completed daily missions for 3 days in a row',
    icon: 'trophy',
    color: '#2196F3', // Blue
    requiredDays: 3
  },
  {
    id: 'streak_5',
    title: 'Regular',
    description: 'Completed daily missions for 5 days in a row',
    icon: 'trophy',
    color: '#9C27B0', // Purple
    requiredDays: 5
  },
  {
    id: 'streak_10',
    title: 'Expert',
    description: 'Completed daily missions for 10 days in a row',
    icon: 'trophy',
    color: '#FF9800', // Orange
    requiredDays: 10
  },
  {
    id: 'streak_15',
    title: 'Master',
    description: 'Completed daily missions for 15 days in a row',
    icon: 'trophy',
    color: '#F44336', // Red
    requiredDays: 15
  },
  {
    id: 'streak_20',
    title: 'Legend',
    description: 'Completed daily missions for 20 days in a row',
    icon: 'trophy',
    color: '#FFD700', // Gold
    requiredDays: 20
  }
];

export const CHALLENGE_ACHIEVEMENTS = [
  {
    id: 'challenge_1',
    title: 'First Challenge',
    description: 'Completed your first challenge',
    icon: 'trophy',
    color: '#E91E63', // Pink
    requiredChallenges: 1
  },
  {
    id: 'challenge_5',
    title: 'Challenge Seeker',
    description: 'Completed 5 challenges',
    icon: 'trophy',
    color: '#9C27B0', // Purple
    requiredChallenges: 5
  },
  {
    id: 'challenge_10',
    title: 'Challenge Master',
    description: 'Completed 10 challenges',
    icon: 'trophy',
    color: '#FF9800', // Orange
    requiredChallenges: 10
  },
  {
    id: 'challenge_25',
    title: 'Challenge Champion',
    description: 'Completed 25 challenges',
    icon: 'trophy',
    color: '#FFD700', // Gold
    requiredChallenges: 25
  }
];

const POINTS = {
  DAILY_MISSION: 50,
  CHALLENGE: 100,
  STREAK_BONUS: 25, // Additional points per day of streak
};

export async function getUserStats(): Promise<UserStats> {
  try {
    const stats = await AsyncStorage.getItem('userStats');
    if (stats) {
      return JSON.parse(stats);
    }
    // Initialize default stats
    const defaultStats: UserStats = {
      consecutiveDays: 0,
      totalPoints: 0,
      totalChallenges: 0
    };
    await AsyncStorage.setItem('userStats', JSON.stringify(defaultStats));
    return defaultStats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      consecutiveDays: 0,
      totalPoints: 0,
      totalChallenges: 0
    };
  }
}

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  try {
    const achievements = await AsyncStorage.getItem('achievements');
    return achievements ? JSON.parse(achievements) : [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}

export async function updateDailyStreak() {
  try {
    const stats = await getUserStats();
    const today = new Date().toISOString().split('T')[0];
    
    if (stats.lastActiveDate === today) {
      return; // Already updated today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.lastActiveDate === yesterdayStr) {
      // Increment streak
      stats.consecutiveDays += 1;
    } else {
      // Reset streak
      stats.consecutiveDays = 1;
    }

    stats.lastActiveDate = today;
    await AsyncStorage.setItem('userStats', JSON.stringify(stats));
    
    // Check for new achievements
    await checkAndUpdateAchievements(stats.consecutiveDays);
  } catch (error) {
    console.error('Error updating daily streak:', error);
  }
}

export async function addPoints(type: 'DAILY_MISSION' | 'CHALLENGE') {
  try {
    const stats = await getUserStats();
    const pointsToAdd = POINTS[type] + (stats.consecutiveDays * POINTS.STREAK_BONUS);
    
    stats.totalPoints += pointsToAdd;
    if (type === 'CHALLENGE') {
      stats.totalChallenges += 1;
    }
    
    await AsyncStorage.setItem('userStats', JSON.stringify(stats));
    return pointsToAdd;
  } catch (error) {
    console.error('Error adding points:', error);
    return 0;
  }
}

export async function checkAndUpdateAchievements(consecutiveDays: number) {
  try {
    const unlockedAchievements = await getUnlockedAchievements();
    const newAchievements: Achievement[] = [];
    const stats = await getUserStats();

    // Check streak achievements
    for (const achievement of STREAK_ACHIEVEMENTS) {
      if (
        consecutiveDays >= achievement.requiredDays &&
        !unlockedAchievements.some(a => a.id === achievement.id)
      ) {
        newAchievements.push({
          ...achievement,
          isUnlocked: true,
          unlockedAt: new Date()
        });
      }
    }

    // Check challenge achievements
    for (const achievement of CHALLENGE_ACHIEVEMENTS) {
      if (
        stats.totalChallenges >= achievement.requiredChallenges &&
        !unlockedAchievements.some(a => a.id === achievement.id)
      ) {
        newAchievements.push({
          ...achievement,
          isUnlocked: true,
          unlockedAt: new Date()
        });
      }
    }

    if (newAchievements.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newAchievements];
      await AsyncStorage.setItem('achievements', JSON.stringify(updatedAchievements));
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

export function getNextAchievement(consecutiveDays: number): Achievement | null {
  const nextAchievement = STREAK_ACHIEVEMENTS.find(a => a.requiredDays > consecutiveDays);
  return nextAchievement ? {
    ...nextAchievement,
    isUnlocked: false
  } : null;
} 