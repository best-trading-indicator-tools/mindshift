import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoard'>;

const VisionBoardScreen: React.FC<Props> = ({ navigation, route }) => {
  const handleComplete = async () => {
    try {
      if (route.params?.context === 'challenge') {
        if (route.params.onComplete) {
          route.params.onComplete();
        }
        if (route.params.returnTo === 'ChallengeDetail') {
          navigation.navigate('ChallengeDetail', {
            challenge: {
              id: route.params.challengeId || '',
              title: 'Ultimate',
              duration: 21,
              description: '',
              image: null
            }
          });
        } else {
          navigation.goBack();
        }
      } else {
        await markDailyExerciseAsCompleted('vision-board');
        navigation.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Vision Board Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VisionBoardScreen; 