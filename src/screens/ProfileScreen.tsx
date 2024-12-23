import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Avatar, ListItem } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';

const IconComponent = MaterialCommunityIcons as any;

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
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
      onPress: () => navigation.navigate('Notifications'),
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
        <Text style={styles.name}>John Doe</Text>
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
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.map((achievement, index) => (
          <ListItem 
            key={index} 
            bottomDivider
            containerStyle={styles.listItem}
            >
            <IconComponent name={achievement.icon} size={24} color={achievement.color} />
            <ListItem.Content>
              <ListItem.Title style={styles.listItemTitle}>{achievement.title}</ListItem.Title>
              <ListItem.Subtitle style={styles.listItemSubtitle}>{achievement.description}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {settings.map((setting, index) => (
          <ListItem 
            key={index} 
            bottomDivider
            containerStyle={styles.listItem}
            onPress={setting.onPress}
            >
            <IconComponent name={setting.icon} size={24} color="#6366f1" />
            <ListItem.Content>
              <ListItem.Title style={styles.listItemTitle}>{setting.title}</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron color="#6366f1" />
          </ListItem>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: '#2A2A2A',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  listItem: {
    backgroundColor: '#1A1A1A',
    marginBottom: 1,
    borderBottomColor: '#2A2A2A',
  },
  listItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  listItemSubtitle: {
    color: '#A0A0A0',
    fontSize: 14,
  },
});

export default ProfileScreen;
