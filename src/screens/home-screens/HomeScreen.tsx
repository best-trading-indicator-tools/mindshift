import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Image, Alert } from 'react-native';
import { Text, LinearProgress } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps, NavigationProp } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../../navigation/AppNavigator';
import { MeditationIllustration, WalkingIllustration, GratitudeIllustration } from '../../components/Illustrations';
import ProgressBar from '../../components/ProgressBar';
import { NotificationBell } from '../../components/NotificationBell';
import CircularProgress from '../../components/CircularProgress';
import auth from '@react-native-firebase/auth';
import MissionItem from '../../components/MissionItem';
import { isExerciseCompletedToday, getStreak, resetAllDailyExercises, checkDailyProgress, clearAllAppData } from '../../services/exerciseService';
import { clearNotifications } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    title: 'Mood Tracker',
    subtitle: 'Track your daily emotional well-being',
    icon: 'chart-line',
    colors: ['#1E90FF', '#4CAF50'],
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
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userName, setUserName] = useState('User');
  const [streak, setStreak] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const windowWidth = Dimensions.get('window').width;
  const cardWidth = windowWidth * 0.7;
  const cardSpacing = 12;
  const [hasNotifications, setHasNotifications] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const isCheckingRef = useRef(false);

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

  // Update initial load useEffect
  useEffect(() => {
    checkExerciseCompletions();
    loadStreak();
    updateProgress();
  }, []);

  // Update focus listener useEffect
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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No user found, skipping exercise completion check');
        return;
      }

      console.log('Checking exercise completions for user:', currentUser.uid);
      
      // Get completion status for all exercises
      const exerciseIds = DAILY_MISSIONS.map(mission => {
        switch (mission.title) {
          case 'Deep Breathing':
            return 'deep-breathing';
          case 'Daily Gratitude':
            return 'gratitude';
          case 'Active Incantations':
            return 'active-incantations';
          case 'Passive Incantations':
            return 'passive-incantations';
          case 'Golden Checklist':
            return 'golden-checklist';
          default:
            return null;
        }
      }).filter(Boolean) as string[];

      const results = await Promise.all(
        exerciseIds.map(id => isExerciseCompletedToday(id))
      );
      
      const completed = exerciseIds.filter((id, index) => results[index]);
      setCompletedExercises(completed);
      
    } catch (error) {
      console.error('Error checking exercise completion:', error);
      console.error('Error details:', JSON.stringify(error));
    }
  };

  const loadStreak = async () => {
    try {
      const currentStreak = await getStreak();
      console.log('Current streak:', currentStreak);
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const updateProgress = async () => {
    try {
      const progress = await checkDailyProgress();
      setProgressPercentage(progress.progressPercentage);
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

  const handleReset = async () => {
    Alert.alert(
      'Reset App Data',
      'This will clear all app data including vision boards, exercises, and settings. This action cannot be undone. Are you sure?',
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
              await clearAllAppData();
              // Refresh the UI
              await checkExerciseCompletions();
              await loadStreak();
              await updateProgress();
              // Show success message
              Alert.alert('Success', 'All app data has been cleared.');
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
    try {
      // Clear the flag to ensure intro is shown
      await AsyncStorage.removeItem('daily_gratitude_intro_seen');
      navigation.getParent()?.navigate('DailyGratitudeIntro');
    } catch (error) {
      console.error('Error handling gratitude navigation:', error);
      navigation.getParent()?.navigate('DailyGratitudeIntro');
    }
  };

  const handleDeepBreathingNavigation = async () => {
    try {
      // Clear the flag to ensure intro is shown
      await AsyncStorage.removeItem('deep_breathing_intro_seen');
      navigation.getParent()?.navigate('DeepBreathingIntro');
    } catch (error) {
      console.error('Error handling deep breathing navigation:', error);
      navigation.getParent()?.navigate('DeepBreathingIntro');
    }
  };

  const handleActiveIncantationsNavigation = async () => {
    try {
      // Clear the flag to ensure intro is shown
      await AsyncStorage.removeItem('active_incantations_intro_seen');
      navigation.getParent()?.navigate('ActiveIncantationsIntro');
    } catch (error) {
      console.error('Error handling active incantations navigation:', error);
      navigation.getParent()?.navigate('ActiveIncantationsIntro');
    }
  };

  const handlePassiveIncantationsNavigation = async () => {
    try {
      // Clear the flag to ensure intro is shown
      await AsyncStorage.removeItem('passive_incantations_intro_seen');
      navigation.getParent()?.navigate('PassiveIncantationsIntro');
    } catch (error) {
      console.error('Error handling passive incantations navigation:', error);
      navigation.getParent()?.navigate('PassiveIncantationsIntro');
    }
  };

  const handleGoldenChecklistNavigation = async () => {
    try {
      // Clear the flag to ensure intro is shown
      await AsyncStorage.removeItem('golden_checklist_intro_seen');
      navigation.getParent()?.navigate('GoldenChecklistIntro');
    } catch (error) {
      console.error('Error handling golden checklist navigation:', error);
      navigation.getParent()?.navigate('GoldenChecklistIntro');
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour {userName}!</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              {renderIcon('refresh', 24, '#FF4444')}
            </TouchableOpacity>
            <View style={styles.streakContainer}>
              {renderIcon('fire', 24, '#FFD700')}
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <View style={styles.bellContainer}>
              <NotificationBell />
            </View>
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
            <ProgressBar 
              totalSteps={DAILY_MISSIONS.length}
              completedSteps={completedExercises.length}
              completedMissions={completedExercises}
              missions={DAILY_MISSIONS.map(mission => ({
                title: mission.title,
                id: mission.title === 'Deep Breathing' 
                  ? 'deep-breathing'
                  : mission.title === 'Active Incantations'
                  ? 'active-incantations'
                  : mission.title === 'Passive Incantations'
                  ? 'passive-incantations'
                  : mission.title === 'Daily Gratitude'
                  ? 'gratitude'
                  : mission.title === 'Golden Checklist'
                  ? 'golden-checklist'
                  : ''
              }))}
            />
            <View style={styles.missionsList}>
              {DAILY_MISSIONS.map((mission, index) => (
                <MissionItem
                  key={index}
                  {...mission}
                  onPress={
                    mission.title === 'Deep Breathing' 
                      ? handleDeepBreathingNavigation
                      : mission.title === 'Active Incantations'
                      ? handleActiveIncantationsNavigation
                      : mission.title === 'Passive Incantations'
                      ? handlePassiveIncantationsNavigation
                      : mission.title === 'Daily Gratitude'
                      ? handleGratitudeNavigation
                      : mission.title === 'Golden Checklist'
                      ? handleGoldenChecklistNavigation
                      : undefined
                  }
                  isCompleted={
                    mission.title === 'Deep Breathing'
                      ? completedExercises.includes('deep-breathing')
                      : mission.title === 'Active Incantations'
                      ? completedExercises.includes('active-incantations')
                      : mission.title === 'Passive Incantations'
                      ? completedExercises.includes('passive-incantations')
                      : mission.title === 'Daily Gratitude'
                      ? completedExercises.includes('gratitude')
                      : mission.title === 'Golden Checklist'
                      ? completedExercises.includes('golden-checklist')
                      : false
                  }
                />
              ))}
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