import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'GoldenChecklistIntro'>;

const GoldenChecklistIntroScreen: React.FC<Props> = ({ navigation }) => {
  const handleNext = async () => {
    try {
      await AsyncStorage.setItem('golden_checklist_intro_seen', 'true');
    } catch (error) {
      console.error('Error saving intro state:', error);
    }
    navigation.push('GoldenChecklist');
  };

  const handleExit = () => {
    navigation.push('GoldenChecklist');
  };

  return (
    <View style={styles.container}>
      <ProgressHeader
        currentStep={1}
        totalSteps={1}
        onExit={handleExit}
        onNext={handleNext}
        showNext={true}
      />

      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title}>Golden Checklist</Text>
          <Text style={styles.description}>
            Review your daily achievements and habits. Check off each item you've successfully completed today.{'\n\n'}
            Be honest with yourself - this is about personal growth and accountability.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Start Review</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  textContent: {
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.8,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#FFD700',
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GoldenChecklistIntroScreen; 