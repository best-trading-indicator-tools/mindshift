import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useMissionsContext } from '../../contexts/MissionsContext';
import { useNotificationsContext } from '../../contexts/NotificationsContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathComplete'>;

const SunBreathCompleteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { completeMission } = useMissionsContext();
  const { addNotification } = useNotificationsContext();

  const handleRepeat = () => {
    navigation.replace('SunBreathExercise');
  };

  const handleComplete = () => {
    // Mark mission as complete
    completeMission('The Sun Breath');
    
    // Add completion notification
    addNotification({
      title: 'Mission Complete!',
      message: 'You have completed The Sun Breath exercise.',
      type: 'success',
      timestamp: new Date(),
    });

    navigation.navigate('MainTabs');
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SunBreathCompleteScreen; 