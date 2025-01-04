import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { getBreathSettings, saveBreathSettings, resetBreathSettings, BreathSettings } from '../../../services/breathSettingsService';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathSettings'>;

const SunBreathSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [settings, setSettings] = useState<BreathSettings>({
    inhaleSeconds: 4,
    holdSeconds: 1,
    exhaleSeconds: 6,
    cycles: 1,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await getBreathSettings();
    setSettings(savedSettings);
  };

  const handleSave = async () => {
    await saveBreathSettings(settings);
    setHasChanges(false);
    navigation.navigate('SunBreathTutorial');
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
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
            <Text style={styles.buttonText}>Reset to Default</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.saveButton, !hasChanges && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
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
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#333333',
  },
  saveButton: {
    backgroundColor: '#FFD700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

export default SunBreathSettingsScreen; 