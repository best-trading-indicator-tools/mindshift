import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text } from '@rneui/themed';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../../navigation/AppNavigator';
import ChallengeCard from '../../components/ChallengeCard';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Challenges'>,
  NativeStackScreenProps<RootStackParamList>
>;

const challenges = [
  {
    id: '1',
    title: 'Ultimate',
    duration: 21,
    description: 'Your subconscious mind shapes your reality. This 21-day challenge uses proven techniques to rewire your thought patterns and transform your mindset.\nPerfect for anyone seeking deeper happiness, lasting motivation, and emotional well-being.',
    image: require('../../assets/illustrations/challenge-21.png'),
  },
  // Add more challenges here as needed
];

const ChallengesScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Challenges</Text>
        </View>

        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            title={challenge.title}
            duration={challenge.duration}
            description={challenge.description}
            image={challenge.image}
            onPress={() => {
              // Handle challenge selection
              navigation.navigate('ChallengeDetail', { challenge });
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
