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
      <View style={styles.content}>
        <Text style={styles.title}>Daily Challenges</Text>
        <Text style={styles.description}>Complete challenges to earn points</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <IconComponent name="star" size={24} color="#FFD700" />
          <Text style={styles.statText}>1,250</Text>
        </View>
        <View style={styles.stat}>
          <IconComponent name="trophy" size={24} color="#6366f1" />
          <Text style={styles.statText}>12</Text>
        </View>
        <View style={styles.stat}>
          <IconComponent name="fire" size={24} color="#FF4136" />
          <Text style={styles.statText}>5</Text>
        </View>
      </View>

      {challenges.map((challenge, index) => (
        <Card key={index} containerStyle={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <IconComponent name={challenge.icon} size={24} color="#6366f1" />
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.points}>+{challenge.points}</Text>
          </View>
          <Card.Divider />
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
          <Button
            title="Start Challenge"
            titleStyle={styles.buttonText}
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
    marginBottom: 20,
    color: '#E0E0E0',
  },
  challengeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  points: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    color: '#E0E0E0',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default ChallengesScreen;
