import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Avatar, ListItem } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const IconComponent = MaterialCommunityIcons as any;

const ProfileScreen = () => {
  const achievements = [
    {
      title: '7-Day Streak',
      description: 'Completed challenges for 7 days in a row',
      icon: 'fire',
      color: '#FF4136',
    },
    {
      title: 'Mindfulness Master',
      description: 'Completed 10 meditation sessions',
      icon: 'meditation',
      color: '#6366f1',
    },
    {
      title: 'Digital Detox',
      description: 'Completed 24 hours without social media',
      icon: 'cellphone-off',
      color: '#2ECC40',
    },
  ];

  const settings = [
    {
      title: 'Notifications',
      icon: 'bell-outline',
    },
    {
      title: 'Privacy',
      icon: 'shield-account-outline',
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
    },
    {
      title: 'About',
      icon: 'information-outline',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar
          size={100}
          rounded
          icon={{ name: 'user', type: 'font-awesome' }}
          containerStyle={styles.avatar}
        />
        <Text h3 style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>18</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1,250</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Challenges</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text h4 style={styles.sectionTitle}>Achievements</Text>
        {achievements.map((achievement, index) => (
          <ListItem key={index} bottomDivider>
            <IconComponent name={achievement.icon} size={24} color={achievement.color} />
            <ListItem.Content>
              <ListItem.Title>{achievement.title}</ListItem.Title>
              <ListItem.Subtitle>{achievement.description}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        ))}
      </View>

      <View style={styles.section}>
        <Text h4 style={styles.sectionTitle}>Settings</Text>
        {settings.map((setting, index) => (
          <ListItem key={index} bottomDivider>
            <IconComponent name={setting.icon} size={24} color="#6366f1" />
            <ListItem.Content>
              <ListItem.Title>{setting.title}</ListItem.Title>
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
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    backgroundColor: '#6366f1',
  },
  name: {
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    padding: 15,
  },
});

export default ProfileScreen;
