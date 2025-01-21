import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Image, Alert } from 'react-native';
import { Text, LinearProgress } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../../navigation/AppNavigator';
import { MeditationIllustration, WalkingIllustration, GratitudeIllustration } from '../../components/Illustrations';
import ProgressBar from '../../components/ProgressBar';
import CircularProgress from '../../components/CircularProgress';
import auth from '@react-native-firebase/auth';
import MissionItem from '../../components/MissionItem';
import { isExerciseCompletedToday, getStreak, resetAllDailyExercises, checkDailyProgress, clearAllAppData, EXERCISE_COMPLETION_KEY } from '../../services/exerciseService';
import { clearNotifications, getNotifications } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResourcePreloadService } from '../../services/resourcePreloadService';
import { isDailyExerciseCompleted } from '../../utils/exerciseCompletion';
import MissionsProgressBar from '../../components/MissionsProgressBar';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface Mission {
  title: string;
  subtitle: string;
  duration: string;
  type: string;
  Illustration: React.ComponentType<any>;
  onPress?: () => void;
}

interface MissionMapping {
  key: string;
  name: string;
}

const renderIcon = (name: string, size: string | number, color: string) => {
  const Icon = MaterialCommunityIcons as any;
  return <Icon name={name} size={size} color={color} />;
};

const challenges = [
  {
    title: 'Vision Board',
    subtitle: 'Visualize your goals and dreams',
    icon: 'image-multiple',
    colors: ['#FF6B6B', '#4ECDC4'],
  },
  {
    title: 'Mentor Board',
    subtitle: 'Create your council of mentors',
    icon: 'account-group',
    colors: ['#9B59B6', '#3498DB'],
  },
  {
    title: 'Guided Relaxation',
    subtitle: 'Relax and sleep better',
    icon: 'sleep',
    colors: ['#4A90E2', '#1A1A1A'],
  },
  {
    title: 'Meditation',
    subtitle: 'Find your inner peace',
    icon: 'meditation',
    colors: ['#9C27B0', '#E91E63'],
  },
  {
    title: 'Gratitude Journal',
    subtitle: 'Practice daily gratitude',
    icon: 'notebook',
    colors: ['#FF9800', '#F44336'],
  },
  {
    title: 'Sleep Better',
    subtitle: 'Improve your sleep quality',
    icon: 'moon-waning-crescent',
    colors: ['#2196F3', '#673AB7'],
  },
  {
    title: 'Mindful Minutes',
    subtitle: '5 minutes of mindfulness',
    icon: 'timer-sand',
    colors: ['#009688', '#4CAF50'],
  },
  {
    title: 'Positive Affirmations',
    subtitle: 'Build self-confidence',
    icon: 'heart',
    colors: ['#FF4081', '#7C4DFF'],
  },
  {
    title: 'Stress Relief',
    subtitle: 'Quick relaxation exercises',
    icon: 'yoga',
    colors: ['#00BCD4', '#3F51B5'],
  },
  {
    title: 'Social Connect',
    subtitle: 'Stay connected with loved ones',
    icon: 'account-group',
    colors: ['#FFC107', '#FF5722'],
  },
];

const DAILY_MISSIONS = [
  {
    title: 'The Sun Breath',
    subtitle: 'Absorb light, release darkness',
    duration: '1-3 min',
    type: 'Training',
    icon: 'white-balance-sunny',
  },
  {
    title: 'Deep Breathing',
    subtitle: 'Train your diaphragm',
    duration: '3-5 min',
    type: 'Training',
    icon: 'emoticon-happy',
  },
  {
    title: 'Daily Gratitude',
    subtitle: 'Count your blessings',
    duration: '5-10 min',
    type: 'Reflection',
    icon: 'heart-outline',
  },
  {
    title: 'Active Incantations',
    subtitle: 'Speak affirmations with conviction',
    duration: '2-3 min',
    type: 'Training',
    icon: 'microphone',
  },
  {
    title: 'Passive Incantations',
    subtitle: 'Record and listen to your affirmations',
    duration: '5-10 min',
    type: 'Training',
    icon: 'headphones',
  },
  {
    title: 'Golden Checklist',
    subtitle: 'End of day achievements review',
    duration: '2-3 min',
    type: 'Review',
    icon: 'checkbox-marked',
  },
  {
    title: 'Gratitude Beads',
    subtitle: 'Practice gratitude with mindful reflection',
    duration: '5-10 min',
    type: 'Reflection',
    icon: 'progress-clock',
  },
  {
    title: 'Self-Hypnosis',
    subtitle: 'Enter a state of deep relaxation',
    duration: '10-15 min',
    type: 'Training',
    icon: 'meditation',
  },
];

const MISSIONS_PER_DAY = 5;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userName, setUserName] = useState('User');
  const [streak, setStreak] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const windowWidth = Dimensions.get('window').width;
  const cardWidth = windowWidth * 0.7;
  const cardSpacing = 12;
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [dailyMissions, setDailyMissions] = useState<typeof DAILY_MISSIONS>([]);
  const isCheckingRef = useRef(false);

  // Function to get today's date as a string
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  // Function to shuffle array using Fisher-Yates algorithm
  const shuffleArray = <T extends any>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Function to select random missions for the day
  const selectDailyMissions = async () => {
    try {
      const today = getTodayString();
      
      // Select new missions only if we don't have today's missions
      const lastUpdateDate = await AsyncStorage.getItem('lastMissionsUpdateDate');
      const storedMissions = await AsyncStorage.getItem('selectedDailyMissions');

      if (lastUpdateDate === today && storedMissions) {
        // Use existing missions
        const missions = JSON.parse(storedMissions);
        setDailyMissions(missions);
        
        // Check if Sun Breath is in today's missions and preload if needed
        if (missions.some((mission: { title: string }) => mission.title === 'The Sun Breath')) {
          console.log('🌞 Sun Breath found in today\'s missions, starting resource preload...');
          ResourcePreloadService.preloadSunBreathResources().catch(error => {
            console.error('❌ Failed to preload Sun Breath resources:', error);
          });
        } else {
          console.log('ℹ️ Sun Breath not in today\'s missions, skipping preload');
        }
        return;
      }

      // Select new missions
      const shuffledMissions = shuffleArray(DAILY_MISSIONS);
      const selectedMissions = shuffledMissions.slice(0, MISSIONS_PER_DAY);
      
      // Store the selected missions and update date
      await AsyncStorage.setItem('selectedDailyMissions', JSON.stringify(selectedMissions));
      await AsyncStorage.setItem('lastMissionsUpdateDate', today);
      
      setDailyMissions(selectedMissions);

      // If Sun Breath is selected, preload its resources
      if (selectedMissions.some((mission: { title: string }) => mission.title === 'The Sun Breath')) {
        console.log('🌞 Sun Breath selected for today\'s missions, starting resource preload...');
        ResourcePreloadService.preloadSunBreathResources().catch(error => {
          console.error('❌ Failed to preload Sun Breath resources:', error);
        });
      } else {
        console.log('ℹ️ Sun Breath not selected for today\'s missions, skipping preload');
      }
    } catch (error) {
      console.error('Error selecting daily missions:', error);
      setDailyMissions(DAILY_MISSIONS.slice(0, MISSIONS_PER_DAY));
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        if (currentUser.displayName) {
          // Get first name only
          const firstName = currentUser.displayName.split(' ')[0];
          setUserName(firstName);
        } else if (currentUser.email) {
          // If no display name, use email username
          const emailName = currentUser.email.split('@')[0];
          setUserName(emailName);
        }
      }
    };

    getCurrentUser();
  }, []);

  // Update initializeApp to preload resources
  useEffect(() => {
    const initializeApp = async () => {
      try {

        await Promise.all([
          ResourcePreloadService.preloadSunBreathResources()
        ]);
      
        // First check if we have today's missions
        const lastUpdateDate = await AsyncStorage.getItem('lastMissionsUpdateDate');
        const today = getTodayString();

        // Only select new missions if it's a new day or no missions exist
        if (lastUpdateDate !== today) {
          await selectDailyMissions();
        } else {
          // Load existing missions
          const storedMissions = await AsyncStorage.getItem('selectedDailyMissions');
          if (storedMissions) {
            setDailyMissions(JSON.parse(storedMissions));
          } else {
            // If somehow we have a date but no missions, select new ones
            await selectDailyMissions();
          }
        }

        await checkExerciseCompletions();
        await loadStreak();
        await updateProgress();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  // Update focus listener to NOT select new missions
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (auth().currentUser && !isCheckingRef.current) {
        isCheckingRef.current = true;
        Promise.all([
          checkExerciseCompletions(),
          loadStreak(),
          updateProgress()
        ]).finally(() => {
          isCheckingRef.current = false;
        });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const checkExerciseCompletions = async () => {
    try {
      // Get today's selected missions
      const storedMissions = await AsyncStorage.getItem('selectedDailyMissions');
      if (!storedMissions) {
        console.log('No stored missions found');
        return;
      }

      const missions = JSON.parse(storedMissions).map((mission: typeof DAILY_MISSIONS[0]): MissionMapping => ({
        key: mission.title === 'Deep Breathing' 
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
          : '',
        name: mission.title
      }));

      // Check completion status for each mission using isDailyExerciseCompleted
      const completionPromises = missions.map((mission: MissionMapping) => 
        isDailyExerciseCompleted(mission.key)
      );
      
      const completionResults = await Promise.all(completionPromises);
      
      const completed = missions
        .filter((_: MissionMapping, index: number) => completionResults[index])
        .map((mission: MissionMapping) => mission.key);

      setCompletedExercises(completed);
      
      const percentage = (completed.length / missions.length) * 100;
      setProgressPercentage(percentage);

      console.log('Exercise completions updated:', {
        completed,
        percentage
      });
    } catch (error) {
      console.error('Error checking exercise completions:', error);
    }
  };

  const loadStreak = async () => {
    try {
      const currentStreak = await getStreak();
      //console.log('Current streak:', currentStreak);
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const updateProgress = async () => {
    try {
      const { progressPercentage } = await checkDailyProgress();
      setProgressPercentage(progressPercentage);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };


  const handleScroll = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffset / (cardWidth + cardSpacing));
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, cardWidth, cardSpacing]);

  const signOut = async () => {
    try {
      await auth().signOut();
      // Navigation will be handled by the auth state listener in App.tsx
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDevLogout = async () => {
    try {
      await auth().signOut();
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset All Data',
      'This will reset all your progress, including challenges and daily missions. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // First get all keys from AsyncStorage
              const allKeys = await AsyncStorage.getAllKeys();
              
              // Remove all keys from AsyncStorage
              await AsyncStorage.multiRemove(allKeys);
              
              // Clear notifications
              await clearNotifications();
              
              // Re-select missions after reset
              await selectDailyMissions();
              
              // Reload all audio resources
              await Promise.all([
                ResourcePreloadService.preloadSunBreathResources()
              ]);

              // Reset UI state
              setCompletedExercises([]);
              setProgressPercentage(0);
              setStreak(0);
              
              // Force refresh UI
              await checkExerciseCompletions();
              await loadStreak();
              await updateProgress();
              
              // Force navigation refresh by going to Login and back to MainTabs
              navigation.getParent()?.reset({
                index: 0,
                routes: [
                  { name: 'Login' },
                  { name: 'MainTabs' }
                ],
              });
              
              Alert.alert('Success', 'All data has been reset successfully.');
            } catch (error) {
              console.error('Error resetting app:', error);
              Alert.alert('Error', 'Failed to reset app data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleVisionBoardNavigation = async () => {
    try {
      const hasSeenIntro = await AsyncStorage.getItem('vision_board_intro_seen');
      if (!hasSeenIntro) {
        navigation.getParent()?.navigate('VisionBoardIntro');
      } else {
        navigation.getParent()?.navigate('VisionBoard');
      }
    } catch (error) {
      console.error('Error checking vision board intro state:', error);
      navigation.getParent()?.navigate('VisionBoard');
    }
  };

  const handleGratitudeNavigation = async () => {
    const mission = dailyMissions.find(m => m.title === 'Daily Gratitude');
    if (mission) {
      navigation.navigate('DailyGratitudeIntro');
    }
  };

  const handleDeepBreathingNavigation = async () => {
    const mission = dailyMissions.find(m => m.title === 'Deep Breathing');
    if (mission) {
      navigation.navigate('DeepBreathingIntro');
    }
  };

  const handleActiveIncantationsNavigation = async () => {
    const mission = dailyMissions.find(m => m.title === 'Active Incantations');
    if (mission) {
      navigation.navigate('ActiveIncantationsIntro');
    }
  };

  const handlePassiveIncantationsNavigation = async () => {
    const mission = dailyMissions.find(m => m.title === 'Passive Incantations');
    if (mission) {
      navigation.navigate('PassiveIncantationsIntro');
    }
  };

  const handleGoldenChecklistNavigation = async () => {
    const mission = dailyMissions.find(m => m.title === 'Golden Checklist');
    if (mission) {
      navigation.navigate('GoldenChecklistIntro');
    }
  };

  const handleGratitudeBeadsNavigation = async () => {
    const mission = dailyMissions.find(m => m.title === 'Gratitude Beads');
    if (mission) {
      navigation.navigate('GratitudeBeadsIntro');
    }
  };

  const handleSunBreathNavigation = async () => {
    navigation.navigate('SunBreathTutorial');
  };

  const handleSelfHypnosisNavigation = async () => {
    navigation.navigate('SelfHypnosisIntro');
  };

  const renderChallenges = () => {
    return challenges.map((challenge, index) => (
      <TouchableOpacity
        key={challenge.title}
        style={[
          styles.cardWrapper, 
          { 
            width: cardWidth,
            marginRight: index === challenges.length - 1 ? 20 : cardSpacing
          }
        ]}
        onPress={() => {
          if (challenge.title === 'Vision Board') {
            navigation.getParent()?.navigate('VisionBoardIntro');
          } else if (challenge.title === 'Mentor Board') {
            navigation.getParent()?.navigate('MentorBoardIntro');
          } else if (challenge.title === 'Daily Gratitude') {
            handleGratitudeNavigation();
          } else if (challenge.title === 'Guided Relaxation') {
            navigation.navigate('GuidedRelaxationIntro');
          } else if (challenge.title === 'Meditation') {
            // Handle meditation navigation
          }
          // Add other navigation handlers for other challenges here
        }}
      >
        <View
          style={[styles.card, { 
            backgroundColor: challenge.colors[0],
            overflow: 'hidden',
          }]}
        >
          <View style={styles.gradientOverlay}>
            <LinearProgress
              style={styles.gradientProgress}
              color={challenge.colors[1]}
              variant="determinate"
              value={1}
              animation={false}
            />
          </View>
          <Text style={styles.cardTitle}>{challenge.title}</Text>
          <Text style={styles.cardSubtitle}>{challenge.subtitle}</Text>
          <View style={styles.cardImageContainer}>
            {renderIcon(challenge.icon, 40, "#fff")}
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  useEffect(() => {
    const preloadResourcesIfNeeded = async () => {
      if (dailyMissions.some(mission => mission.title === 'The Sun Breath')) {
        try {
          await ResourcePreloadService.preloadSunBreathResources();
        } catch (error) {
          console.error('Failed to preload sun breath resources:', error);
        }
      }
    };

    preloadResourcesIfNeeded();
  }, [dailyMissions]);

  const checkNotifications = useCallback(async () => {
    const notifications = await getNotifications();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    setHasUnreadNotifications(notifications.some(notification => 
      !notification.isRead && new Date(notification.timestamp) >= today
    ));
  }, []);

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 1000);
    return () => clearInterval(interval);
  }, [checkNotifications]);

  const renderPaginationDots = () => {
    const dots = [];
    const numberOfDots = challenges.length;

    for (let i = 0; i < numberOfDots; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.paginationDot,
            i === activeIndex ? styles.paginationDotActive : null,
          ]}
        />
      );
    }

    return <View style={styles.paginationContainer}>{dots}</View>;
  };

  const renderMissions = () => {
    return dailyMissions.map((mission, index) => (
      <MissionItem
        key={index}
        title={mission.title}
        subtitle={mission.subtitle}
        duration={mission.duration}
        type={mission.type}
        icon={mission.icon}
        isCompleted={completedExercises.includes(
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
        )}
        onPress={() => {
          switch (mission.title) {
            case 'Deep Breathing':
              handleDeepBreathingNavigation();
              break;
            case 'Daily Gratitude':
              handleGratitudeNavigation();
              break;
            case 'Active Incantations':
              handleActiveIncantationsNavigation();
              break;
            case 'Passive Incantations':
              handlePassiveIncantationsNavigation();
              break;
            case 'Golden Checklist':
              handleGoldenChecklistNavigation();
              break;
            case 'Gratitude Beads':
              handleGratitudeBeadsNavigation();
              break;
            case 'The Sun Breath':
              handleSunBreathNavigation();
              break;
            case 'Self-Hypnosis':
              handleSelfHypnosisNavigation();
              break;
          }
        }}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hi {userName}!</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              {renderIcon('refresh', 24, '#FF4444')}
            </TouchableOpacity>
            <View style={styles.streakContainer}>
              {renderIcon('fire', 24, '#FFD700')}
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <MaterialCommunityIcons 
                name="bell-outline" 
                size={24} 
                color="#FFFFFF" 
              />
              {hasUnreadNotifications && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.cardsContainer}
          contentContainerStyle={styles.cardsContentContainer}
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={cardWidth + cardSpacing}
          snapToAlignment="center"
        >
          {renderChallenges()}
        </ScrollView>
        {renderPaginationDots()}

        <TouchableOpacity 
          style={styles.aiCoachButton}
          onPress={() => {
            navigation.getParent()?.navigate('AiCoach');
          }}
        >
          <View style={styles.aiCoachIcon}>
            <Image
              source={require('../../assets/illustrations/atom.gif')}
              style={{ width: 50, height: 50 }}
            />
          </View>
          <View style={styles.aiCoachContent}>
            <Text style={styles.aiCoachTitle}>AI Coach</Text>
            <Text style={styles.aiCoachSubtitle}>Talk with your personal coach</Text>
          </View>
          <View style={styles.aiCoachArrow}>
            {renderIcon("chevron-right", 24, "#fff")}
          </View>
        </TouchableOpacity>

        <View style={styles.missionsContainer}>
          <View style={styles.missionsHeader}>
            <Text style={styles.missionsTitle}>Daily Missions</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Progress</Text>
              <View style={styles.progressRow}>
                <CircularProgress
                  size={24}
                  strokeWidth={2}
                  progress={progressPercentage}
                />
                <Text style={styles.progressPercentage}>
                  {progressPercentage}%
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.missionsContent}>
            <MissionsProgressBar 
              totalSteps={dailyMissions.length}
              completedSteps={completedExercises.length}
              completedMissions={completedExercises}
              missions={dailyMissions.map(mission => ({
                title: mission.title,
                id: mission.title === 'Deep Breathing' 
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
              }))}
            />
            <View style={styles.missionsList}>
              {renderMissions()}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 0,
  },
  signOutButton: {
    padding: 8,
    marginRight: 12,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  notificationIcon: {
    padding: 8,
  },
  cardsContainer: {
    paddingLeft: 20,
  },
  cardsContentContainer: {
    paddingRight: 8, // Additional padding to show next card
  },
  cardWrapper: {
    marginRight: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    height: 140, // Reduced height
    justifyContent: 'space-between',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  gradientProgress: {
    transform: [
      { rotate: '135deg' },
      { scaleX: 2 },
      { translateX: 100 },
    ],
    height: 400,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20, // Slightly smaller font
    fontWeight: 'bold',
    marginBottom: 4, // Reduced spacing
  },
  cardSubtitle: {
    color: '#fff',
    fontSize: 14, // Smaller font
    opacity: 0.8,
  },
  cardImageContainer: {
    alignItems: 'flex-end',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#6366f1',
    width: 8,
    height: 8,
  },
  aiCoachButton: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aiCoachIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCoachContent: {
    flex: 1,
    marginLeft: 15,
  },
  aiCoachTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiCoachSubtitle: {
    color: '#888',
    fontSize: 14,
  },
  aiCoachArrow: {
    opacity: 0.5,
  },
  missionsContainer: {
    marginTop: 20,
    flex: 1,
    width: '90%',
    position: 'relative',
    paddingHorizontal: 16,
  },
  checkmarkContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  missionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  missionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  progressPercentage: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  missionsContent: {
    flexDirection: 'row',
  },
  missionsList: {
    marginTop: 16,
    gap: 12,
    width: '100%',
    paddingLeft: 8,
    paddingRight: 16,
  },
  missionItem: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%', 
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  missionType: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  missionDuration: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  missionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  missionItemTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  missionItemSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  missionIllustrationContainer: {
    position: 'absolute',
    right: 0, 
    top: 0, 
  },
  missionIllustration: {
    width: '100%',
    height: '100%',
  },
  devLogoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  devLogoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    marginRight: 8,
  },
  bellContainer: {
    marginLeft: 0,
  },
});

export default HomeScreen;
