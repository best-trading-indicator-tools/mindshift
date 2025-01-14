import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  Text,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import BreathingAnimation, { BreathingRef } from '../../../components/BreathingAnimation';
import ExitExerciseButton from '../../../components/ExitExerciseButton';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import { markExerciseAsCompleted } from '../../../services/exerciseService';
import { CommonActions, StackActions } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathing'>;

const DeepBreathingScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const breathingAnimationRef = useRef<BreathingRef>(null);
  const { context = 'daily', challengeId, returnTo } = route.params || {};

  useEffect(() => {
    // Save the current status bar style
    const currentStyle = StatusBar.currentHeight;
    
    return () => {
      // Reset status bar on unmount
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#000000');
      }
    };
  }, []);

  const handleExerciseComplete = useCallback(async () => {
    try {
      // First cleanup all resources
      if (breathingAnimationRef.current) {
        breathingAnimationRef.current.cleanupAudio();
      }

      // Mark completion based on context
      if (context === 'daily') {
        await markDailyExerciseAsCompleted('deep-breathing');
        // Only mark general stats for daily missions
        await markExerciseAsCompleted('deep-breathing', 'Deep Breathing');
      } else if (context === 'challenge' && challengeId) {
        // Mark as completed in challenge context
        await markChallengeExerciseAsCompleted(challengeId, 'deep-breathing');
        console.log('Marked deep breathing as completed for challenge:', challengeId);
      }
      
      // Clear any pending state updates
      setShowExitModal(false);
      
      // Navigate to complete screen
      navigation.push('DeepBreathingComplete', {
        context,
        challengeId,
        returnTo
      });
    } catch (error) {
      console.error('Failed to complete exercise:', error);
      navigation.push('DeepBreathingComplete', {
        context,
        challengeId,
        returnTo
      });
    }
  }, [navigation, context, challengeId, returnTo]);

  const handleExit = () => {
    // First cleanup all resources
    if (breathingAnimationRef.current) {
      breathingAnimationRef.current.cleanupAudio();
    }
    setShowExitModal(false);

    if (returnTo) {
      navigation.replace(returnTo, challengeId ? { challengeId } : undefined);
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const handleContinue = () => {
    setShowExitModal(false);
    // Small delay to ensure modal is closed before resuming
    setTimeout(() => {
      if (breathingAnimationRef.current) {
        breathingAnimationRef.current.handleResume();
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000"
        translucent={true}
      />
      <View style={styles.content}>
        <BreathingAnimation
          ref={breathingAnimationRef}
          onPhaseComplete={handleExerciseComplete}
        />
      </View>
      <View style={styles.exitButtonContainer}>
        <ExitExerciseButton onExit={() => {
          setShowExitModal(true);
          
          if (breathingAnimationRef.current) {
            breathingAnimationRef.current.handlePause();
          }
        }} />
      </View>

      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              You're making progress! Continue practicing to maintain your results.
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExit}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  exitButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
  },
  continueText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default DeepBreathingScreen;
