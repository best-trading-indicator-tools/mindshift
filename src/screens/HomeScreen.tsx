import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Text, LinearProgress } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';
import { MeditationIllustration, WalkingIllustration, GratitudeIllustration } from '../components/Illustrations';
import ProgressBar from '../components/ProgressBar';
import NotificationBell from '../components/NotificationBell';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const IconComponent = MaterialCommunityIcons as any;

const renderIcon = (name: string, color: string, size: number) => {
  return <IconComponent name={name} size={size} color={color} />;
};

const challenges = [
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

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const windowWidth = Dimensions.get('window').width;
  const cardWidth = windowWidth * 0.7; // Make cards 70% of screen width
  const cardSpacing = 12; // Space between cards
  const [hasNotifications, setHasNotifications] = useState(true); // You can control this with your notification logic

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / (cardWidth + cardSpacing));
    setActiveIndex(currentIndex);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialCommunityIcons name="account-circle" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
          >
            <NotificationBell 
              hasNotifications={hasNotifications}
              onPress={() => navigation.navigate('Notifications')}
            />
          </TouchableOpacity>
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
          {challenges.map((challenge, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.cardWrapper, 
                { 
                  width: cardWidth,
                  marginRight: index === challenges.length - 1 ? 20 : cardSpacing
                }
              ]}
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
                  />
                </View>
                <Text style={styles.cardTitle}>{challenge.title}</Text>
                <Text style={styles.cardSubtitle}>{challenge.subtitle}</Text>
                <View style={styles.cardImageContainer}>
                  {renderIcon(challenge.icon, "#fff", 40)}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {renderPaginationDots()}

        <TouchableOpacity 
          style={styles.aiCoachButton}
          onPress={() => navigation.navigate('AiCoach')}
        >
          <View style={styles.aiCoachIcon}>
            {renderIcon("robot", "#fff", 24)}
          </View>
          <View style={styles.aiCoachContent}>
            <Text style={styles.aiCoachTitle}>AI Coach</Text>
            <Text style={styles.aiCoachSubtitle}>Talk with your personal coach</Text>
          </View>
          <View style={styles.aiCoachArrow}>
            {renderIcon("chevron-right", "#fff", 24)}
          </View>
        </TouchableOpacity>

        <View style={styles.missionsContainer}>
          <View style={styles.missionsHeader}>
            <Text style={styles.missionsTitle}>Daily Missions</Text>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={styles.progressPercentage}>100%</Text>
            </View>
          </View>
          <View style={styles.missionsContent}>
            <ProgressBar totalSteps={5} completedSteps={5} />
            <View style={styles.missionsList}>
              {[0, 1, 2].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.checkmarkContainer,
                    { top: 35 + index * 120, left: -45 },
                  ]}
                >
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                </View>
              ))}
              {[
                {
                  title: 'Deep Breathing',
                  subtitle: 'Calm, focus and efficiency',
                  duration: '3-5 min',
                  type: 'Training',
                  Illustration: MeditationIllustration,
                },
                {
                  title: 'Mindful Walking',
                  subtitle: 'Connect with your surroundings',
                  duration: '3-5 min',
                  type: 'Training',
                  Illustration: WalkingIllustration,
                },
                {
                  title: 'Neutral Tone',
                  subtitle: 'Practice neutral speaking',
                  duration: '3-5 min',
                  type: 'Training',
                  Illustration: GratitudeIllustration,
                },
              ].map((mission, index) => (
                <View key={index} style={styles.missionItem}>
                  <View style={styles.missionHeader}>
                    <MaterialCommunityIcons name="clock-time-three" size={14} color="#666" />
                    <Text style={styles.missionDuration}>{mission.duration}</Text>
                    <Text style={styles.missionType}>{mission.type}</Text>
                  </View>
                  <View style={styles.missionContent}>
                    <View style={styles.missionTextContainer}>
                      <Text style={styles.missionItemTitle}>{mission.title}</Text>
                      <Text style={styles.missionItemSubtitle}>{mission.subtitle}</Text>
                    </View>
                    <View style={styles.missionIllustrationContainer}>
                      <mission.Illustration style={styles.missionIllustration} />
                    </View>
                  </View>
                </View>
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
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  profileButton: {
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
  },
  aiCoachIcon: {
    backgroundColor: '#6366f1',
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
    width: '80%',
    position: 'relative',
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
  progressCircle: {
    alignItems: 'flex-end',
  },
  progressText: {
    color: '#666',
    fontSize: 14,
  },
  progressPercentage: {
    color: '#4CAF50',
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
    paddingHorizontal: 0,
  },
  missionItem: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    height: 84,
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
    color: '#666',
    fontSize: 14,
  },
  missionIllustrationContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionIllustration: {
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;
