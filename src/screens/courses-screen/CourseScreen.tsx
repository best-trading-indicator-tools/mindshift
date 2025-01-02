import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import { RootStackParamList, RootTabParamList } from '../../navigation/AppNavigator';
import { Icon } from '@rneui/themed';

type TabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Courses'>,
  NativeStackScreenProps<RootStackParamList>
>;

type StackScreenProps = NativeStackScreenProps<RootStackParamList, 'Course'>;

const lessons = [
  {
    title: 'Introduction to Mindfulness',
    description: 'Learn the basics of mindfulness meditation',
    duration: '15 min',
    isLocked: false,
  },
  {
    title: 'Breathing Techniques',
    description: 'Master different breathing exercises',
    duration: '20 min',
    isLocked: false,
  },
  {
    title: 'Body Scan Meditation',
    description: 'Practice full body awareness',
    duration: '25 min',
    isLocked: true,
  },
];

interface CourseContentProps {
  navigation: TabScreenProps['navigation'] | StackScreenProps['navigation'];
}

function CourseContent({ navigation }: CourseContentProps) {
  const handleLessonPress = (index: number, isLocked: boolean) => {
    if (!isLocked) {
      (navigation as StackScreenProps['navigation']).navigate('Lesson', { lessonId: index });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>18-Day Mindfulness Journey</Text>
        <Text style={styles.description}>Transform your mind, one day at a time</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <Text style={styles.description}>Progress: Day 3/18</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: '16.67%' }]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lessons</Text>
        {lessons.map((lesson, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.lessonItem, lesson.isLocked && styles.lockedLesson]}
            onPress={() => handleLessonPress(index, lesson.isLocked)}
          >
            <View style={styles.lessonContent}>
              <View style={styles.lessonHeader}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Icon
                  type="material-community"
                  name={lesson.isLocked ? 'lock' : 'play-circle'} 
                  size={24} 
                  color={lesson.isLocked ? '#999' : '#6366f1'} 
                />
              </View>
              <Text style={styles.lessonDescription}>{lesson.description}</Text>
              <View style={styles.lessonFooter}>
                <View style={styles.durationContainer}>
                  <Icon
                    type="material-community"
                    name="clock-outline"
                    size={16}
                    color="#B0B0B0"
                  />
                  <Text style={styles.durationText}>{lesson.duration}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Tab Navigator Screen
export function CourseTabScreen({ navigation }: TabScreenProps) {
  return <CourseContent navigation={navigation} />;
}

// Stack Navigator Screen
export function CourseStackScreen({ navigation }: StackScreenProps) {
  return <CourseContent navigation={navigation} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    color: '#E0E0E0',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  lessonItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  lessonContent: {
    padding: 15,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 10,
  },
  lessonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: '#B0B0B0',
    marginLeft: 5,
    fontSize: 14,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 5,
  },
  lockedLesson: {
    opacity: 0.7,
  },
});

export default CourseTabScreen;
