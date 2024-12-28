import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

interface ExerciseIntroScreenProps {
  title: string;
  description: string;
  buttonText?: string;
  onStart: () => void;
  onExit: () => void;
}

const ExerciseIntroScreen: React.FC<ExerciseIntroScreenProps> = ({
  title,
  description,
  buttonText = 'Start',
  onStart,
  onExit,
}) => {
  const [showExitModal, setShowExitModal] = useState(false);

  const handleContinue = () => {
    setShowExitModal(false);
  };

  const handleExit = () => {
    setShowExitModal(false);
    onExit();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3730A3', '#6366F1', '#818CF8']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={() => setShowExitModal(true)}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <Modal
        visible={showExitModal}
        transparent={true}
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
              style={[styles.modalButton, styles.continueButton]}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#FFD700' }]}
              onPress={handleExit}
            >
              <Text style={{ color: '#000000', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>Exit</Text>
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
    backgroundColor: '#3730A3',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 50 : 40,
    marginLeft: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
    paddingTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  description: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 40,
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    color: '#6366F1',
    fontSize: 22,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
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
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#6366F1',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ExerciseIntroScreen; 