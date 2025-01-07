import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Text } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../../navigation/AppNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Challenges'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // 16 padding on each side

const ChallengesScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Challenges</Text>
        </View>

        {/* Mind Rewiring Challenge Card */}
        <TouchableOpacity style={styles.challengeCard}>
          <View style={styles.durationBadge}>
            <MaterialCommunityIcons name="calendar" size={16} color="#FFFFFF" />
            <Text style={styles.durationText}>21 days</Text>
          </View>

          <Text style={styles.challengeTitle}>Rewire Your Mind</Text>
          
          <Text style={styles.challengeDescription}>
            Ready to transform your life? Want to be more motivated, happier, and unlock your full potential?
          </Text>

          <Text style={styles.statsText}>
            92% of users notice positive changes after completing their first training session.
          </Text>

          <View style={styles.challengeContent}>
            <Text style={styles.contentDescription}>
              Your subconscious mind shapes your reality. This 21-day challenge uses proven techniques to rewire your thought patterns, boost your motivation, and create lasting happiness. Perfect for busy people who want real transformation.
            </Text>
          </View>

          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: '#151932',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    width: cardWidth,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  durationText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  challengeDescription: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 16,
    lineHeight: 24,
  },
  statsText: {
    fontSize: 16,
    color: '#6366f1',
    marginBottom: 16,
    fontWeight: '600',
  },
  challengeContent: {
    marginBottom: 20,
  },
  contentDescription: {
    fontSize: 15,
    color: '#B0B0B0',
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChallengesScreen;
