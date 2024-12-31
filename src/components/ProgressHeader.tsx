import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onExit?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onExit,
  showPrevious = true,
  showNext = true,
}) => {
  const progress = currentStep / totalSteps;
  const [showExitModal, setShowExitModal] = React.useState(false);

  const handleConfirmExit = () => {
    onExit?.();
    setShowExitModal(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={() => setShowExitModal(true)}
      >
        <Icon name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressWrapper, { width: `${progress * 100}%` }]}>
            <View style={styles.progressBase} />
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.7)',  // Bright white highlight at top
                'rgba(255, 255, 255, 0.3)',  // Softer white
                'rgba(255, 215, 0, 0)',      // Fade to base yellow
              ]}
              locations={[0, 0.3, 1]}
              style={styles.progressSheen}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.navButton, !showNext && styles.hidden]} 
        onPress={onNext}
        disabled={!showNext}
      >
        <Icon name="chevron-right" size={24} color="#FFFFFF" />
      </TouchableOpacity>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 52,
    width: '100%',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBackground: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressWrapper: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',  // Base yellow color
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  progressSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 22,
  },
  hidden: {
    opacity: 0,
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
});

export default ProgressHeader; 