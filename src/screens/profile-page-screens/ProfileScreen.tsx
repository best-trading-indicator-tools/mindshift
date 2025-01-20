import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { Text, Avatar, ListItem } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [weekCompletions, setWeekCompletions] = useState<{ [key: string]: boolean }>({});
  const [isUploading, setIsUploading] = useState(false);

  const defaultProfileImage = require('../../assets/illustrations/profile/profile-placeholder.png');

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
        
        // Try to get existing profile image
        if (currentUser.photoURL) {
          setProfileImage(currentUser.photoURL);
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

  const handleImageUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.didCancel || !result.assets?.[0]?.uri) {
        return;
      }

      setIsUploading(true);

      const imageUri = result.assets[0].uri;
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Upload to Firebase Storage
      const filename = `profile_${currentUser.uid}_${Date.now()}.jpg`;
      const reference = storage().ref(`profile_images/${filename}`);
      
      await reference.putFile(imageUri);
      const downloadURL = await reference.getDownloadURL();

      // Update user profile
      await currentUser.updateProfile({
        photoURL: downloadURL,
      });

      setProfileImage(downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Support')}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={24} color="#fff" />
              <Text style={styles.iconText}>Help</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <MaterialCommunityIcons name="cog" size={24} color="#fff" />
              <Text style={styles.iconText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={handleImageUpload}
            disabled={isUploading}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatar}
              />
            ) : (
              <Image
                source={defaultProfileImage}
                style={styles.avatar}
              />
            )}
            <View style={styles.uploadOverlay}>
              <MaterialCommunityIcons 
                name="camera" 
                size={24} 
                color="#FFFFFF" 
              />
            </View>
          </TouchableOpacity>
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
                  isToday ? styles.dayTextActive : isCompleted ? styles.dayTextActive : styles.dayTextInactive
                ]}>
                  {day}
                </Text>
                <View style={[
                  styles.dayIndicator,
                  !isToday && isCompleted ? styles.dayCompleted : null,
                ]}>
                  {isToday ? (
                    <MaterialCommunityIcons name="fire" size={32} color="#FFD700" />
                  ) : isCompleted ? (
                    <MaterialCommunityIcons name="check" size={24} color="#000000" />
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

        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity 
              style={styles.devLogoutButton}
              onPress={handleDevLogout}
            >
              <Text style={styles.devLogoutText}>Dev Log Out</Text>
            </TouchableOpacity>
          )}
        </View>
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  iconText: {
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
    position: 'relative',
    marginRight: 20,
  },
  userInfoContainer: {
    flex: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2A2A2A',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  logoutContainer: {
    padding: 15,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  devLogoutButton: {
    backgroundColor: '#FF4444',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  devLogoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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
