import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathComplete'>;

const SunBreathCompleteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleRepeat = () => {
    navigation.replace('SunBreathExercise');
  };

  const handleComplete = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <LinearGradient
      colors={['#FF8C00', '#FFD700']}
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

          <Text style={styles.title}>Exercise Complete!</Text>
          
          <Text style={styles.message}>
            Take a moment to notice how you feel.{'\n'}
            Your body and mind are now refreshed and energized.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.repeatButton]} 
              onPress={handleRepeat}
            >
              <MaterialCommunityIcons name="repeat" size={24} color="#FF8C00" />
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
    marginBottom: 30,
    opacity: 0.95,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  message: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 50,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 15,
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
  },
  repeatButtonText: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SunBreathCompleteScreen; 