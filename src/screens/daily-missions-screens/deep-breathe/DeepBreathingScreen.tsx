import React, { useState, useEffect, useRef } from 'react';
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
import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import { markExerciseAsCompleted } from '../../../services/exerciseService';
import { CommonActions, StackActions } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathing'>;

const DeepBreathingScreen: React.FC<Props> = ({ navigation }) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const breathingAnimationRef = useRef<BreathingRef>(null);

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      console.log('Navigation state changed:', e.data);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('Navigation methods available:', {
      push: typeof navigation.push === 'function',
      navigate: typeof navigation.navigate === 'function',
      goBack: typeof navigation.goBack === 'function',
      dispatch: typeof navigation.dispatch === 'function'
    });
    console.log('Full navigation object:', navigation);
    console.log('=== END NAVIGATION DEBUG ===');
  }, [navigation]);

  const handleExerciseComplete = async () => {
    try {
      if (breathingAnimationRef.current) {
        breathingAnimationRef.current.cleanupAudio();
      }
      await markDailyExerciseAsCompleted('deep-breathing');
      await markExerciseAsCompleted('deep-breathing', 'Deep Breathing');
      navigation.push('MainTabs');
    } catch (error) {
      console.error('Failed to complete exercise:', error);
      navigation.push('MainTabs');
    }
  };

  const handleExit = () => {
    if (breathingAnimationRef.current) {
      breathingAnimationRef.current.cleanupAudio();
    }
    setShowExitModal(false);
    navigation.navigate('MainTabs');
  };

  const handleContinue = () => {
    setShowExitModal(false);
    if (breathingAnimationRef.current) {
      breathingAnimationRef.current.handleResume();
    }
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
