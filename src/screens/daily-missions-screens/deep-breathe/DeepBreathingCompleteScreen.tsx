import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathingComplete'>;

const DeepBreathingCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  const handleExit = async () => {
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
              image: require('../../../assets/illustrations/challenges/challenge-21.png')
            }
          });
        } else {
          navigation.goBack();
        }
      } else {
        await markDailyExerciseAsCompleted('deep-breathing');
        navigation.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
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

          <Text style={styles.title}>Have a good day!</Text>
          
          <TouchableOpacity 
            style={styles.exitButton} 
            onPress={handleExit}
          >
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
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