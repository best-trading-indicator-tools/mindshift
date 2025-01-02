import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { BreathSettings, getBreathSettings, saveBreathSettings, resetBreathSettings } from '../services/breathSettingsService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: BreathSettings) => void;
}

const BreathSettingsModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [settings, setSettings] = useState<BreathSettings>({
    inhaleSeconds: 4,
    holdSeconds: 1,
    exhaleSeconds: 6,
    cycles: 1,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const savedSettings = await getBreathSettings();
    setSettings(savedSettings);
  };

  const handleSave = async () => {
    await saveBreathSettings(settings);
    setHasChanges(false);
    onSave(settings);
    onClose();
  };

  const handleReset = async () => {
    await resetBreathSettings();
    await loadSettings();
    setHasChanges(false);
  };

  const updateSetting = (key: keyof BreathSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Breath Settings</Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.settingContainer}>
              <Text style={styles.settingTitle}>Inhale Duration</Text>
              <Text style={styles.settingValue}>{settings.inhaleSeconds} seconds</Text>
              <Slider
                style={styles.slider}
                minimumValue={2}
                maximumValue={8}
                step={1}
                value={settings.inhaleSeconds}
                onValueChange={(value) => updateSetting('inhaleSeconds', value)}
                minimumTrackTintColor="#FFD700"
                maximumTrackTintColor="#333333"
                thumbTintColor="#FFD700"
              />
            </View>

            <View style={styles.settingContainer}>
              <Text style={styles.settingTitle}>Hold Duration</Text>
              <Text style={styles.settingValue}>{settings.holdSeconds} seconds</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={4}
                step={1}
                value={settings.holdSeconds}
                onValueChange={(value) => updateSetting('holdSeconds', value)}
                minimumTrackTintColor="#FFD700"
                maximumTrackTintColor="#333333"
                thumbTintColor="#FFD700"
              />
            </View>

            <View style={styles.settingContainer}>
              <Text style={styles.settingTitle}>Exhale Duration</Text>
              <Text style={styles.settingValue}>{settings.exhaleSeconds} seconds</Text>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={10}
                step={1}
                value={settings.exhaleSeconds}
                onValueChange={(value) => updateSetting('exhaleSeconds', value)}
                minimumTrackTintColor="#FFD700"
                maximumTrackTintColor="#333333"
                thumbTintColor="#FFD700"
              />
            </View>

            <View style={styles.settingContainer}>
              <Text style={styles.settingTitle}>Number of Cycles</Text>
              <Text style={styles.settingValue}>{settings.cycles} cycles</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={settings.cycles}
                onValueChange={(value) => updateSetting('cycles', value)}
                minimumTrackTintColor="#FFD700"
                maximumTrackTintColor="#333333"
                thumbTintColor="#FFD700"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.resetButton]} 
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset to Default</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.saveButton, !hasChanges && styles.buttonDisabled]} 
                onPress={handleSave}
                disabled={!hasChanges}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    borderRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  settingContainer: {
    marginBottom: 24,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  settingValue: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  resetButton: {
    backgroundColor: '#222222',
  },
  saveButton: {
    backgroundColor: '#FFD700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
});

export default BreathSettingsModal; 