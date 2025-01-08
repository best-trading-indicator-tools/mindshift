import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathingComplete'>;

const DeepBreathingCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  useEffect(() => {
    // Enable playback in silence mode
    Sound.setCategory('Playback', true);

    // Play completion sound
    const sound = new Sound(require('../../../assets/audio/haveagreatday.wav'), error => {
      if (error) {
        console.error('Failed to load completion sound:', error);
        return;
      }
      sound.play(success => {
        if (!success) {
          console.error('Failed to play completion sound');
        }
      });
    });

    // Auto-exit after 3 seconds
    const timer = setTimeout(handleExit, 3000);

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.release();
      }
    };
  }, []);

  const handleExit = async () => {
    try {
      if (route.params?.context === 'challenge' && route.params.challengeId) {
        // Mark as completed for challenge only
        await markChallengeExerciseAsCompleted(route.params.challengeId, 'deep-breathing');
        
        // Call onComplete callback if provided
        if (route.params.onComplete) {
          route.params.onComplete();
        }

        // Handle navigation
        if (route.params.returnTo === 'ChallengeDetail') {
          navigation.navigate('ChallengeDetail', {
            challenge: {
              id: route.params.challengeId,
              title: 'Ultimate',
              duration: 21,
              description: '',
              image: require('../../../assets/illustrations/challenges/challenge-21.png')
            }
          });
        } else {
          navigation.goBack();
        }
      } else {
        // Mark as completed for daily mission
        await markDailyExerciseAsCompleted('deep-breathing');
        navigation.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
      navigation.goBack();
    }
  };

  return (
    <LinearGradient
      colors={['#4A90E2', '#357ABD', '#2C3E50']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <MaterialCommunityIcons 
            name="meditation" 
            size={120} 
            color="white" 
            style={styles.icon}
          />

          <Text style={styles.title}>Have a great day!</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  icon: {
    marginBottom: 60,
    opacity: 0.95,
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    color: 'white',
    marginBottom: 60,
    textAlign: 'center',
    lineHeight: 56,
  },
  exitButton: {
    backgroundColor: '#FCD34D',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DeepBreathingCompleteScreen; 