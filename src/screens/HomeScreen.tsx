import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Text } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';

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
  const cardWidth = windowWidth - 40;

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / cardWidth);
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
        <View style={styles.headerSpacing} />
        <View style={styles.header}>
          <Text h2 style={styles.greeting}>Bonjour!</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              {renderIcon("fire", "#FFD700", 24)}
              <Text style={styles.statText}>6</Text>
            </View>
            <View style={styles.stat}>
              {renderIcon("medal", "#7B68EE", 24)}
              <Text style={styles.statText}>0</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationIcon}
              onPress={() => navigation.navigate('Notifications')}
            >
              {renderIcon("bell", "#fff", 24)}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.cardsContainer}
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={cardWidth}
          snapToAlignment="center"
        >
          {challenges.map((challenge, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.cardWrapper, { width: cardWidth }]}
            >
              <LinearGradient
                colors={challenge.colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>{challenge.title}</Text>
                <Text style={styles.cardSubtitle}>{challenge.subtitle}</Text>
                <View style={styles.cardImageContainer}>
                  {renderIcon(challenge.icon, "#fff", 40)}
                </View>
              </LinearGradient>
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
            <Text style={styles.aiCoachTitle}>Coach IA</Text>
            <Text style={styles.aiCoachSubtitle}>Parle avec ton coach personnel</Text>
          </View>
          <View style={styles.aiCoachArrow}>
            {renderIcon("chevron-right", "#fff", 24)}
          </View>
        </TouchableOpacity>
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
  headerSpacing: {
    height: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
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
    paddingHorizontal: 20,
  },
  cardWrapper: {
    marginRight: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    height: 180,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: '#fff',
    fontSize: 16,
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
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
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
});

export default HomeScreen;
