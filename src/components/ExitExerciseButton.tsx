import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Modal,
} from 'react-native';

interface ExitExerciseButtonProps {
  onExit: () => void;
}

const ExitExerciseButton: React.FC<ExitExerciseButtonProps> = ({ onExit }) => {
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={() => setShowExitConfirmation(true)}
      >
        <Text style={styles.exitButtonText}>Exit</Text>
      </TouchableOpacity>

      <Modal
        visible={showExitConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              You're making progress! Continue practicing to maintain your results.
            </Text>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => setShowExitConfirmation(false)}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exitModalButton}
              onPress={onExit}
            >
              <Text style={styles.exitModalButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  exitButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#151932',
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
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exitModalButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    width: '100%',
    borderRadius: 30,
    backgroundColor: '#FFD700',
  },
  exitModalButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ExitExerciseButton; 