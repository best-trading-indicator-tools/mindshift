import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Text, Avatar, ListItem } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { setQuestionnaireStatus } from '../../services/questionnaireService';
import { isDailyExerciseCompleted } from '../../utils/exerciseCompletion';

const IconComponent = MaterialCommunityIcons as any;

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [weekCompletions, setWeekCompletions] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const getCurrentUser = async () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        if (currentUser.displayName) {
          // Get first name only
          const firstName = currentUser.displayName.split(' ')[0];
          setUserName(firstName);
        } else if (currentUser.email) {
          // If no display name, use email username
          const emailName = currentUser.email.split('@')[0];
          setUserName(emailName);
        }
        if (currentUser.email) {
          setUserEmail(currentUser.email);
        }
      }
    };

    getCurrentUser();
  }, []);

  // Get the day abbreviation for a given date
  const getDayAbbr = (date: Date) => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return days[date.getDay()];
  };

  // Get current week's dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dates = [];
    
    // Start from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      // Adjust to get Monday as first day
      const diff = i - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      date.setDate(today.getDate() + diff);
      dates.push(date);
    }
    
    return dates;
  };

  // Check if all daily missions are completed for a given date
  const checkDayCompletion = async (date: Date) => {
    try {
      const storedMissions = await AsyncStorage.getItem('selectedDailyMissions');
      if (!storedMissions) return false;

      const missions = JSON.parse(storedMissions);
      const missionKeys = missions.map((mission: any) => 
        mission.title === 'Deep Breathing' ? 'deep-breathing'
        : mission.title === 'Active Incantations' ? 'active-incantations'
        : mission.title === 'Passive Incantations' ? 'passive-incantations'
        : mission.title === 'Daily Gratitude' ? 'daily-gratitude'
        : mission.title === 'Golden Checklist' ? 'golden-checklist'
        : mission.title === 'Gratitude Beads' ? 'gratitude-beads'
        : mission.title === 'The Sun Breath' ? 'sun-breath'
        : ''
      );

      const completions = await Promise.all(
        missionKeys.map((key: string) => isDailyExerciseCompleted(key))
      );

      return completions.every(completed => completed);
    } catch (error) {
      console.error('Error checking day completion:', error);
      return false;
    }
  };

  // Update week completions
  useEffect(() => {
    const updateWeekCompletions = async () => {
      const weekDates = getCurrentWeekDates();
      const completions: { [key: string]: boolean } = {};

      for (const date of weekDates) {
        const dayAbbr = getDayAbbr(date);
        const isCompleted = await checkDayCompletion(date);
        completions[dayAbbr] = isCompleted;
      }

      setWeekCompletions(completions);
    };

    updateWeekCompletions();
    const interval = setInterval(updateWeekCompletions, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      
      // Utilise navigation.getParent() pour accéder au navigateur parent
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleDevLogout = async () => {
    try {
      // First, reset questionnaire status
      await setQuestionnaireStatus('not_started');
      
      // Clear any stored data
      await AsyncStorage.clear();

      // Check if user is signed in before attempting to sign out
      const currentUser = auth().currentUser;
      if (currentUser) {
        // Set up a one-time auth state listener before signing out
        const unsubscribe = auth().onAuthStateChanged((user) => {
          if (!user) {
            // User is fully signed out, now safe to navigate
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'PreQuestionnaire' }],
            });
            // Clean up listener
            unsubscribe();
          }
        });

        // Trigger the sign out
        await auth().signOut();
      } else {
        // If no user is signed in, navigate immediately
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'PreQuestionnaire' }],
        });
      }
    } catch (error) {
      console.error('Dev Logout Error:', error);
      Alert.alert(
        'Logout Error',
        'There was an error during logout. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
          <View style={styles.helpContainer}>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => (navigation as any).navigate('Support')}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={24} color="#fff" />
              <Text style={styles.helpText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Avatar
              size={100}
              rounded
              icon={{ name: 'user', type: 'font-awesome' }}
              containerStyle={styles.avatar}
            />
          </View>
          <View style={styles.userInfoContainer}>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.email}>{userEmail}</Text>
          </View>
        </View>

        <View style={styles.weekTracker}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => {
            const isToday = day === getDayAbbr(new Date());
            const isCompleted = weekCompletions[day];
            
            return (
              <View key={day} style={styles.dayColumn}>
                <Text style={[
                  styles.dayText,
                  isCompleted || isToday ? styles.dayTextActive : styles.dayTextInactive
                ]}>
                  {day}
                </Text>
                <View style={[
                  styles.dayIndicator,
                  isCompleted ? styles.dayCompleted : null,
                  isToday && isCompleted ? styles.dayToday : null,
                ]}>
                  {isCompleted ? (
                    <MaterialCommunityIcons name="check" size={24} color="#000000" />
                  ) : isToday && isCompleted ? (
                    <MaterialCommunityIcons name="fire" size={24} color="#FFD700" />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.trackerMessage}>
          <Text style={styles.trackerMessageText}>
            Train every day to keep your streak going!
          </Text>
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
              <MaterialCommunityIcons name={setting.icon} size={24} color="#6366f1" />
              <ListItem.Content>
                <ListItem.Title style={styles.listItemTitle}>{setting.title}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron color="#6366f1" />
            </ListItem>
          ))}

          <ListItem 
            containerStyle={[styles.listItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
            <ListItem.Content>
              <ListItem.Title style={[styles.listItemTitle, styles.logoutText]}>Log Out</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </View>

        {__DEV__ && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#FF4444', marginHorizontal: 15, marginBottom: 20 }]}
            onPress={handleDevLogout}
          >
            <Text style={styles.buttonText}>Dev Log Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  helpText: {
    color: '#fff',
    fontSize: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    paddingTop: 20,
  },
  avatarWrapper: {
    marginRight: 20,
  },
  userInfoContainer: {
    flex: 1,
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
  logoutItem: {
    marginTop: 20,
    backgroundColor: '#1E1E1E',
  },
  logoutText: {
    color: '#FF4444',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weekTracker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    marginBottom: 8,
  },
  dayTextActive: {
    color: '#FFD700',
  },
  dayTextInactive: {
    color: '#666',
  },
  dayIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCompleted: {
    backgroundColor: '#FFD700',
  },
  dayToday: {
    backgroundColor: '#1A1A1A',
  },
  trackerMessage: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  trackerMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default ProfileScreen;
