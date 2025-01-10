import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { CommonActions } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathingComplete'>;

const DeepBreathingCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const { context = 'daily', challengeId, returnTo } = route.params || {};

  // Debug log for initial params
  useEffect(() => {
    console.log('Complete Screen Mounted with params:', {
      context,
      challengeId,
      returnTo,
      routeParams: route.params
    });
  }, []);

  const handleExit = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (returnTo) {
      navigation.replace(returnTo, challengeId ? { challengeId } : undefined);
    } else {
      navigation.dispatch(StackActions.popToTop());
      navigation.navigate('MainTabs');
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
        navigation.push(returnTo, challengeId ? { challengeId } : undefined);
      } else {
        navigation.dispatch(StackActions.popToTop());
        navigation.navigate('MainTabs');
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.release();
      }
    };
  }, [navigation, returnTo, challengeId]);

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
              style={styles.modalExitButton}
              onPress={handleConfirmExit}
            >
              <Text style={styles.modalExitText}>Exit</Text>
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
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
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
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    backgroundColor: '#FFD700',
  },
  continueText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalExitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#E31837',
  },
  modalExitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DeepBreathingCompleteScreen; 