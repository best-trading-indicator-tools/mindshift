import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  MainTabs: undefined;
};

interface ExitModalProps {
  visible: boolean;
  onContinue: () => void;
  onExit?: () => void;
}

const ExitModal: React.FC<ExitModalProps> = ({
  visible,
  onContinue,
  onExit,
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleExit = () => {
    if (onExit) {
      onExit();
    }
    navigation.navigate('MainTabs');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.exitModalOverlay}>
        <View style={styles.exitModalContent}>
          <Text style={styles.exitModalTitle}>Wait! Are you sure?</Text>
          <Text style={styles.exitModalText}>
            You're making progress! Continue practicing to maintain your results.
          </Text>
          <TouchableOpacity 
            style={[styles.exitModalButton, { backgroundColor: '#FFD700' }]}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.exitModalButton, { backgroundColor: '#E31837' }]}
            onPress={handleExit}
          >
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  exitModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  exitModalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  exitModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  exitModalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 24,
  },
  exitModalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ExitModal; 