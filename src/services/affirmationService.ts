import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

const COLLECTION_NAME = 'affirmations';

export interface Affirmation {
  id: string;
  text: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
}

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