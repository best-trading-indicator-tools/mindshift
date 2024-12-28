import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Affirmation {
  id: string;
  text: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
  tag?: string;  // Optional tag for the affirmation
}

// No need for these functions anymore since we're handling storage in the component
export const getUserAffirmations = async (): Promise<Affirmation[]> => {
  throw new Error('This function is deprecated. Use local storage instead.');
};

export const saveAffirmation = async (
  text: string,
  audioUrl: string,
  duration: number
): Promise<Affirmation> => {
  throw new Error('This function is deprecated. Use local storage instead.');
};

export const deleteAffirmation = async (id: string): Promise<void> => {
  throw new Error('This function is deprecated. Use local storage instead.');
};

// Add new functions for tag management
export const STORAGE_KEYS = {
  AFFIRMATIONS: 'affirmations',
  TAGS: 'affirmation_tags'
};

export const saveTags = async (tags: string[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  } catch (error) {
    console.error('Failed to save tags:', error);
  }
};

export const loadTags = async (): Promise<string[]> => {
  try {
    const savedTags = await AsyncStorage.getItem(STORAGE_KEYS.TAGS);
    return savedTags ? JSON.parse(savedTags) : [];
  } catch (error) {
    console.error('Failed to load tags:', error);
    return [];
  }
}; 