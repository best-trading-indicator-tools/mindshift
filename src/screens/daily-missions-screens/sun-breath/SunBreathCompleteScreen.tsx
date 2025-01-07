import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathComplete'>;
type Props = NativeStackScreenProps<RootStackParamList, 'SunBreathComplete'>;

const SunBreathCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  const handleRepeat = () => {
    navigation.push('SunBreathExercise');
  };

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
        await markDailyExerciseAsCompleted('sun-breath');
        navigation.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  
  return (
    <LinearGradient
      colors={['#F4A261', '#FFB347', '#FFD700']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <MaterialCommunityIcons 
            name="check-circle" 
            size={100} 
            color="white" 
            style={styles.icon}
          />

          <Text style={styles.title}>Exercise{'\n'}Complete!</Text>
          
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Take a moment to notice how you feel.{'\n\n'}
              Your body and mind are now refreshed and energized.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.repeatButton]} 
              onPress={handleRepeat}
            >
              <MaterialCommunityIcons name="repeat" size={24} color="#F4A261" />
              <Text style={styles.repeatButtonText}>Repeat</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.completeButton]} 
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
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
  },
  icon: {
    marginBottom: 40,
    opacity: 0.95,
  },
  title: {
    fontSize: 42,
    fontWeight: '600',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 48,
  },
  messageContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 60,
    width: '100%',
  },
  message: {
    fontSize: 22,
    color: 'white',
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.95,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 15,
    paddingBottom: 20,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  repeatButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  repeatButtonText: {
    color: '#F4A261',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: 'white',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonText: {
    color: '#F4A261',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SunBreathCompleteScreen; 