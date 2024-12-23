import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const IconComponent = MaterialCommunityIcons as any;

const renderIcon = (name: string, color: string, size: number) => {
  return <IconComponent name={name} size={size} color={color} />;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.headerSpacing} />
        <View style={styles.header}>
          <Text h2 style={styles.greeting}>Hello!</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              {renderIcon("fire", "#FFD700", 24)}
              <Text style={styles.statText}>6</Text>
            </View>
            <View style={styles.stat}>
              {renderIcon("medal", "#7B68EE", 24)}
              <Text style={styles.statText}>0</Text>
            </View>
            <TouchableOpacity style={styles.notificationIcon}>
              {renderIcon("bell", "#fff", 24)}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#1E90FF' }]}>
            <Text style={styles.cardTitle}>Voice Evaluation</Text>
            <Text style={styles.cardSubtitle}>Discover how your voice is perceived</Text>
            <View style={styles.cardImageContainer}>
              {renderIcon("microphone", "#fff", 40)}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { backgroundColor: '#4B0082' }]}>
            <Text style={styles.cardTitle}>Accent Test</Text>
            <Text style={styles.cardSubtitle}>Get information about your accent</Text>
            <View style={styles.cardImageContainer}>
              {renderIcon("account-voice", "#fff", 40)}
            </View>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity 
          style={styles.aiCoachButton}
          onPress={() => navigation.navigate('AiCoach')}
        >
          {renderIcon("robot", "#00BFFF", 24)}
          <Text style={styles.aiCoachText}>AI Coach</Text>
          {renderIcon("chevron-right", "#fff", 24)}
        </TouchableOpacity>

        <View style={styles.dailyMissionsContainer}>
          <View style={styles.missionHeader}>
            <Text style={styles.missionTitle}>Daily Missions</Text>
            {renderIcon("information", "#666", 20)}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={styles.progressPercentage}>100%</Text>
            </View>
          </View>

          <View style={styles.missionList}>
            {[
              {
                title: 'Deep Breathing',
                subtitle: 'Calm, focus and efficiency',
                icon: 'meditation',
                duration: '3-5 min',
              },
              {
                title: 'Descending Sound',
                subtitle: 'Harmony of resonance and depth',
                icon: 'waveform',
                duration: '3-5 min',
              },
              {
                title: 'Neutral Intonation',
                subtitle: 'Neutral Intonation',
                icon: 'tune-vertical',
                duration: '3-5 min',
              },
            ].map((mission, index) => (
              <View key={index} style={styles.missionItem}>
                <View style={styles.missionContent}>
                  {renderIcon(mission.icon, "#fff", 24)}
                  <View style={styles.missionTextContainer}>
                    <Text style={styles.missionItemTitle}>{mission.title}</Text>
                    <Text style={styles.missionItemSubtitle}>{mission.subtitle}</Text>
                  </View>
                  <Text style={styles.missionDuration}>{mission.duration}</Text>
                </View>
                {renderIcon("check-circle", "#4CAF50", 24)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
  },
  headerSpacing: {
    height: 20, // Add extra spacing at the top
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  notificationIcon: {
    marginLeft: 10,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    width: 280,
    height: 160,
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
  },
  cardImageContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  aiCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  aiCoachText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
    flex: 1,
  },
  dailyMissionsContainer: {
    padding: 20,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  missionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    color: '#666',
    fontSize: 12,
  },
  progressPercentage: {
    color: '#fff',
    fontSize: 16,
  },
  missionList: {
    gap: 15,
  },
  missionItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  missionTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  missionItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  missionItemSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  missionDuration: {
    color: '#666',
    fontSize: 12,
    marginLeft: 10,
  },
});

export default HomeScreen;
