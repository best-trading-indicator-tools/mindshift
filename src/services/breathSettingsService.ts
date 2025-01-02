import AsyncStorage from '@react-native-async-storage/async-storage';

const BREATH_SETTINGS_KEY = 'breath_settings';

export interface BreathSettings {
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  cycles: number;
}

const DEFAULT_SETTINGS: BreathSettings = {
  inhaleSeconds: 4,
  holdSeconds: 1,
  exhaleSeconds: 6,
  cycles: 1,
};

export const getBreathSettings = async (): Promise<BreathSettings> => {
  try {
    const settings = await AsyncStorage.getItem(BREATH_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting breath settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveBreathSettings = async (settings: BreathSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(BREATH_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving breath settings:', error);
  }
};

export const resetBreathSettings = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(BREATH_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch (error) {
    console.error('Error resetting breath settings:', error);
  }
}; 