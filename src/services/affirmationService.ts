import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

const COLLECTION_NAME = 'affirmations';

export interface Affirmation {
  id: string;
  userId: string;
  text: string;
  title: string;
  category: string;
  createdAt: Date;
  audioUrl: string;
  duration: number;
}

export const saveAffirmation = async (
  text: string,
  audioUri: string,
  duration: number,
  category: string = 'Personal'
): Promise<Affirmation> => {
  const userId = auth().currentUser?.uid;
  if (!userId) {
    throw new Error('User must be logged in to save affirmations');
  }

  try {
    // 1. Upload audio file to Firebase Storage
    console.log('Starting audio upload to Firebase Storage');
    const audioRef = storage().ref(`affirmations/${userId}/${Date.now()}.m4a`);
    await audioRef.putFile(audioUri);
    console.log('Audio file uploaded successfully');
    const audioUrl = await audioRef.getDownloadURL();
    console.log('Audio URL retrieved:', audioUrl);

    // 2. Save affirmation data to Firestore
    console.log('Saving affirmation data to Firestore');
    const affirmationData = {
      userId,
      text,
      title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
      category,
      createdAt: firestore.FieldValue.serverTimestamp(),
      audioUrl,
      duration,
    };

    const docRef = await firestore()
      .collection(COLLECTION_NAME)
      .add(affirmationData);
    console.log('Affirmation saved successfully with ID:', docRef.id);

    return {
      id: docRef.id,
      ...affirmationData,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error saving affirmation:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to save recording: ${error.message}`);
    }
    throw new Error('Failed to save recording. Please try again.');
  }
};

export const getUserAffirmations = async (): Promise<Affirmation[]> => {
  const userId = auth().currentUser?.uid;
  if (!userId) {
    console.error('No user ID found when fetching affirmations');
    throw new Error('User must be logged in to fetch affirmations');
  }

  try {
    console.log('Fetching affirmations for user:', userId);
    const snapshot = await firestore()
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .get();

    console.log('Fetched affirmations count:', snapshot.docs.length);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Affirmation;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error in getUserAffirmations:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to load affirmations: ${error.message}`);
    }
    throw new Error('Failed to load affirmations');
  }
};

export const deleteAffirmation = async (affirmationId: string): Promise<void> => {
  const userId = auth().currentUser?.uid;
  if (!userId) {
    throw new Error('User must be logged in to delete affirmations');
  }

  // 1. Get the affirmation to find its audio URL
  const doc = await firestore()
    .collection(COLLECTION_NAME)
    .doc(affirmationId)
    .get();

  if (!doc.exists) {
    throw new Error('Affirmation not found');
  }

  const data = doc.data();
  if (data?.audioUrl) {
    // 2. Delete the audio file from Storage
    const audioRef = storage().refFromURL(data.audioUrl);
    await audioRef.delete();
  }

  // 3. Delete the document from Firestore
  await firestore()
    .collection(COLLECTION_NAME)
    .doc(affirmationId)
    .delete();
}; 