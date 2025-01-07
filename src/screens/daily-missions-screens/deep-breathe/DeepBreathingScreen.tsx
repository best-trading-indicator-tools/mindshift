import React, { useState, useEffect } from 'react';
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
import BreathingAnimation from '../../../components/BreathingAnimation';
import ExitExerciseButton from '../../../components/ExitExerciseButton';
import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathing'>;

const DeepBreathingScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showExitModal, setShowExitModal] = useState(false);

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

  const handleExitPress = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    // Handle exit based on context
    if (route.params?.context === 'challenge') {
      // Let the challenge flow handle the completion if needed
      if (route.params.onComplete) {
        route.params.onComplete();
      }
      
      // Navigate back to challenge if specified
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
      // Default behavior for daily mission
      navigation.navigate('MainTabs');
    }
  };

  const handleComplete = async () => {
    // Navigate to completion screen with the same params
    navigation.push('DeepBreathingComplete', {
      context: route.params?.context,
      challengeId: route.params?.challengeId,
      onComplete: route.params?.onComplete,
      returnTo: route.params?.returnTo
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000"
        translucent={false}
      />
      <View style={styles.content}>
        <BreathingAnimation
          navigation={navigation}
          onComplete={handleComplete}
        />
      </View>
      <View style={styles.exitButtonContainer}>
        <ExitExerciseButton onExit={handleExitPress} />
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
              onPress={() => setShowExitModal(false)}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleConfirmExit}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
