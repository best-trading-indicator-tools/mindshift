import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Text } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;

type TabType = 'trainings' | 'preview';

interface ExerciseProps {
  title: string;
  description: string;
  isCompleted?: boolean;
}

const ExerciseCard: React.FC<ExerciseProps> = ({ title, description, isCompleted }) => (
  <View style={styles.exerciseCard}>
    <View style={styles.exerciseContent}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseTitle}>{title}</Text>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <MaterialCommunityIcons name="check" size={16} color="#000" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>
      <Text style={styles.exerciseDescription}>{description}</Text>
      <TouchableOpacity style={styles.startButton}>
        <Text style={styles.startButtonText}>Start Training</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ChallengeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('trainings');
  const { challenge } = route.params;

  const weeks = [
    { id: 1, title: 'Week 1' },
    { id: 2, title: 'Week 2' },
    { id: 3, title: 'Week 3' },
    { id: 4, title: 'Week 4' },
  ];

  const exercises = [
    {
      id: 1,
      title: 'Vocal Range',
      description: 'Harmonize your vocal range for improved resonance and depth.',
      isCompleted: true,
    },
    // Add more exercises here
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Image 
          source={challenge.image}
          style={styles.challengeImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>{challenge.title}</Text>
        <View style={styles.durationBadge}>
          <MaterialCommunityIcons name="layers" size={20} color="#FFFFFF" />
          <Text style={styles.durationText}>{challenge.duration} days</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.continueButton}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'trainings' && styles.activeTab]}
          onPress={() => setActiveTab('trainings')}
        >
          <Text style={[styles.tabText, activeTab === 'trainings' && styles.activeTabText]}>
            Trainings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
          onPress={() => setActiveTab('preview')}
        >
          <Text style={[styles.tabText, activeTab === 'preview' && styles.activeTabText]}>
            Preview
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'trainings' && (
        <ScrollView style={styles.content}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weeksContainer}
          >
            {weeks.map((week, index) => (
              <View 
                key={week.id} 
                style={[
                  styles.weekItem,
                  index === 0 && styles.activeWeek
                ]}
              >
                <View style={styles.weekDot} />
                <Text style={styles.weekText}>Week {week.id}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.exercisesContainer}>
            {exercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                title={exercise.title}
                description={exercise.description}
                isCompleted={exercise.isCompleted}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {activeTab === 'preview' && (
        <ScrollView style={styles.content}>
          <Text style={styles.previewText}>{challenge.description}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  heroSection: {
    alignItems: 'center',
    padding: 20,
  },
  challengeImage: {
    width: width * 0.8,
    height: width * 0.6,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#FCD34D',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FCD34D',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  weeksContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  weekItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  activeWeek: {
    borderBottomWidth: 2,
    borderBottomColor: '#FCD34D',
  },
  weekText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  exercisesContainer: {
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: '#151932',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  exerciseContent: {
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#FCD34D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
  },
});

export default ChallengeDetailScreen; 