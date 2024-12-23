import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ListItem } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CourseScreen = () => {
  const lessons = [
    {
      day: 1,
      title: 'Introduction to Mindfulness',
      completed: true,
    },
    {
      day: 2,
      title: 'Understanding Your Thoughts',
      completed: true,
    },
    {
      day: 3,
      title: 'The Power of Positive Affirmations',
      completed: false,
    },
    {
      day: 4,
      title: 'Breathing Techniques',
      locked: true,
    },
    {
      day: 5,
      title: 'Journaling for Self-Discovery',
      locked: true,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h3>18-Day Mindfulness Journey</Text>
        <Text style={styles.subtitle}>Transform your mind, one day at a time</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Progress: Day 3/18</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: '16.67%' }]} />
        </View>
      </View>

      <View style={styles.lessonsList}>
        {lessons.map((lesson, index) => (
          <ListItem
            key={index}
            containerStyle={[
              styles.lessonItem,
              lesson.locked && styles.lockedLesson,
            ]}
          >
            <MaterialCommunityIcons
              name={
                lesson.completed
                  ? 'check-circle'
                  : lesson.locked
                  ? 'lock'
                  : 'play-circle-outline'
              }
              size={24}
              color={
                lesson.completed ? '#4CAF50' : lesson.locked ? '#999' : '#6366f1'
              }
            />
            <ListItem.Content>
              <ListItem.Title style={lesson.locked && styles.lockedText}>
                Day {lesson.day}: {lesson.title}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  progress: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 5,
  },
  lessonsList: {
    marginTop: 10,
  },
  lessonItem: {
    marginBottom: 1,
  },
  lockedLesson: {
    backgroundColor: '#f5f5f5',
  },
  lockedText: {
    color: '#999',
  },
});

export default CourseScreen;
