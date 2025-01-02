import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathComplete'>;

const SunBreathCompleteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleFinish = () => {
    navigation.navigate('MainTabs');
  };

  const handleRepeat = () => {
    navigation.navigate('SunBreathExercise');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF8C00', '#FFD700']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons 
            name="check-circle" 
            size={120} 
            color="#FFF" 
          />
          
          <Text style={styles.title}>Exercise Complete!</Text>
          <Text style={styles.subtitle}>You've absorbed the light and released the darkness</Text>
          
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Take a moment to notice how you feel. Your body and mind are now refreshed and energized.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.repeatButton]}
              onPress={handleRepeat}
            >
              <MaterialCommunityIcons name="repeat" size={24} color="#FF8C00" />
              <Text style={styles.repeatButtonText}>Repeat</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.finishButton]}
              onPress={handleFinish}
            >
              <Text style={styles.finishButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 8,
    marginBottom: 40,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 40,
  },
  message: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  repeatButton: {
    backgroundColor: '#FFF',
  },
  finishButton: {
    backgroundColor: '#FF8C00',
  },
  repeatButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default SunBreathCompleteScreen; 