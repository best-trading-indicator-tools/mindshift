import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export type ExerciseType = 
  | 'deep-breathing'
  | 'active-incantations'
  | 'passive-incantations'
  | 'meditation'
  | 'gratitude'
  | 'visualization';

const COLLECTION_NAME = 'exerciseCompletions';

export interface ExerciseCompletion {
  userId: string;
  exerciseType: string;
  completedAt: Date;
}

export const markExerciseAsCompleted = async (exerciseType: string) => {
  const userId = auth().currentUser?.uid;
  if (!userId) {
    throw new Error('User must be logged in to track exercise completion');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await firestore()
    .collection(COLLECTION_NAME)
    .doc(`${userId}_${exerciseType}_${today.toISOString().split('T')[0]}`)
    .set({
      userId,
      exerciseType,
      completedAt: firestore.FieldValue.serverTimestamp(),
    });
};

export const isExerciseCompletedToday = async (exerciseType: string): Promise<boolean> => {
  const userId = auth().currentUser?.uid;
  if (!userId) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const docId = `${userId}_${exerciseType}_${today.toISOString().split('T')[0]}`;
  const doc = await firestore()
    .collection(COLLECTION_NAME)
    .doc(docId)
    .get();

  return doc.exists;
}; 