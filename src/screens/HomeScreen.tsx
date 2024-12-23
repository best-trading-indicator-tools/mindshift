import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from '@rneui/themed';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h1>Welcome to MindShift</Text>
        <Text style={styles.subtitle}>Your journey to mindfulness begins here</Text>
      </View>

      <Card containerStyle={styles.card}>
        <Card.Title>Today's Focus</Card.Title>
        <Card.Divider />
        <Text style={styles.cardText}>
          "The only way to do great work is to love what you do."
        </Text>
        <Text style={styles.author}>- Steve Jobs</Text>
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title>Daily Challenge</Card.Title>
        <Card.Divider />
        <Text style={styles.cardText}>
          Practice mindful breathing for 5 minutes
        </Text>
        <Button
          title="Start Now"
          buttonStyle={styles.button}
          containerStyle={styles.buttonContainer}
        />
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title>Progress</Card.Title>
        <Card.Divider />
        <Text style={styles.progressText}>Course Progress: Day 3/18</Text>
        <Text style={styles.progressText}>Challenges Completed: 12</Text>
        <Text style={styles.progressText}>Mindfulness Streak: 5 days</Text>
      </Card>
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
  card: {
    borderRadius: 10,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  author: {
    fontSize: 14,
    textAlign: 'right',
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default HomeScreen;
