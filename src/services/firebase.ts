import firestore from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Exporter les services Firebase
export { auth, firestore };

export interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  subscriptionStatus: 'free' | 'trial' | 'monthly' | 'yearly';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
}

export const createUserProfile = async (user: FirebaseAuthTypes.User): Promise<void> => {
  const userRef = firestore().collection('users').doc(user.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const userData: UserData = {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      subscriptionStatus: 'trial',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    try {
      await userRef.set(userData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  } else {
    await userRef.update({
      lastLoginAt: new Date(),
    });
  }
};

export const getCurrentUser = async (): Promise<UserData | null> => {
  const currentUser = auth().currentUser;
  if (!currentUser) return null;

  const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
  return userDoc.data() as UserData;
};

export const updateUserProfile = async (userId: string, data: Partial<UserData>): Promise<void> => {
  try {
    await firestore().collection('users').doc(userId).update(data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
