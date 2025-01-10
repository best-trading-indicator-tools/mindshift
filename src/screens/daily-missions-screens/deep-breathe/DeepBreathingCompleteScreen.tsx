import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import { CommonActions } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathingComplete'>;

const DeepBreathingCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const { context = 'daily', challengeId, returnTo } = route.params || {};

  const handleExit = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (returnTo) {
      navigation.replace(returnTo, challengeId ? { challengeId } : undefined);
    } else {
      navigation.replace('MainTabs');
    }
  };

  const handleContinue = () => {
    setShowExitModal(false);
  };

  useEffect(() => {
    Sound.setCategory('Playback', true);

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

    const timer = setTimeout(() => {
      if (returnTo) {
        navigation.replace(returnTo, challengeId ? { challengeId } : undefined);
      } else {
        navigation.replace('MainTabs');
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.release();
      }
    };
  }, []);

  useEffect(() => {
    console.log("Modal state changed:", showExitModal);
  }, [showExitModal]);

  return (
    <View style={StyleSheet.absoluteFill}>
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
            
            <TouchableOpacity 
              style={[styles.exitButton, { zIndex: 999 }]}
              activeOpacity={0.7}
              onPress={handleExit}
            >
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

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
              style={[styles.exitButton, { backgroundColor: '#DC2626' }]}
              onPress={handleConfirmExit}
            >
              <Text style={[styles.exitText, { color: 'white' }]}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    zIndex: 1001,
    width: '100%',
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  continueText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  exitText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DeepBreathingCompleteScreen; 