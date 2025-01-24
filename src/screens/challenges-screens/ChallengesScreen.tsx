import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../../navigation/types';
import ChallengeCard from '../../components/ChallengeCard';
import { getChallengeProgress } from '../../utils/exerciseCompletion';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Challenges'>,
  NativeStackScreenProps<RootStackParamList>
>;

const challenges = [
  {
    id: '2',
    title: 'Deep Mind Programming',
    duration: 7,
    description: 'Maximize your mindset transformation through strategic exercise sequencing. This 7-day challenge uses the power of self-hypnosis to amplify the effects of gratitude and affirmations.',
    image: require('../../assets/illustrations/challenges/challenge-21.png'),
  },
  {
    id: '1',
    title: 'Ultimate',
    duration: 21,
    description: 'Your subconscious mind shapes your reality. This 21-day challenge uses proven techniques to rewire your thought patterns and transform your mindset.\nPerfect for anyone seeking deeper happiness, lasting motivation, and emotional well-being.',
    image: require('../../assets/illustrations/challenges/challenge-21.png'),
  },
  // Add more challenges here as needed
];

const ChallengesScreen: React.FC<Props> = ({ navigation }) => {
  const [challengeProgress, setChallengeProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadProgress = async () => {
      const progressMap: Record<string, boolean> = {};
      for (const challenge of challenges) {
        const progress = await getChallengeProgress(challenge.id);
        progressMap[challenge.id] = progress.completedCount > 0;
      }
      setChallengeProgress(progressMap);
    };

    loadProgress();
  }, []);

  const handleVisionBoardPress = () => {
    navigation.navigate('VisionBoard', {
      source: 'challenges'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Challenges</Text>
          <TouchableOpacity onPress={handleVisionBoardPress}>
            {/* Your vision board navigation button/icon */}
          </TouchableOpacity>
        </View>

        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            title={challenge.title}
            duration={challenge.duration}
            description={challenge.description}
            image={challenge.image}
            hasStarted={challengeProgress[challenge.id]}
            onPress={() => {
              navigation.navigate('ChallengeDetail', {
                challenge,
                source: 'challenges'
              });
            }}
          />
        ))}
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
});

export default ChallengesScreen;
