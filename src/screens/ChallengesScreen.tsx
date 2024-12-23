import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const IconComponent = MaterialCommunityIcons as any;

const ChallengesScreen = () => {
  const challenges = [
    {
      title: 'Digital Detox',
      description: 'Stay off social media for 24 hours',
      points: 100,
      icon: 'cellphone-off',
    },
    {
      title: 'Gratitude Journal',
      description: 'Write down 3 things you\'re grateful for',
      points: 50,
      icon: 'notebook',
    },
    {
      title: 'Mindful Walking',
      description: 'Take a 15-minute walk without any distractions',
      points: 75,
      icon: 'walk',
    },
    {
      title: 'Deep Breathing',
      description: 'Practice deep breathing exercises for 5 minutes',
      points: 30,
      icon: 'weather-windy',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h3>Daily Challenges</Text>
        <Text style={styles.subtitle}>Complete challenges to earn points</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <IconComponent name="star" size={24} color="#FFD700" />
          <Text style={styles.statValue}>1,250</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <IconComponent name="trophy" size={24} color="#6366f1" />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <IconComponent name="fire" size={24} color="#FF4136" />
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {challenges.map((challenge, index) => (
        <Card key={index} containerStyle={styles.card}>
          <View style={styles.challengeHeader}>
            <IconComponent name={challenge.icon} size={24} color="#6366f1" />
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.points}>+{challenge.points}</Text>
          </View>
          <Card.Divider />
          <Text style={styles.description}>{challenge.description}</Text>
          <Button
            title="Start Challenge"
            buttonStyle={styles.button}
            containerStyle={styles.buttonContainer}
          />
        </Card>
      ))}
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    borderRadius: 10,
    marginBottom: 10,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  points: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default ChallengesScreen;
