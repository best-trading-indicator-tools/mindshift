import Superwall from '@superwall/react-native-superwall';
import { PurchaseController, PurchaseResult, RestorationResult, SubscriptionStatus } from '@superwall/react-native-superwall';
import { auth, firestore, UserData } from '../services/firebase';

type SubscriptionStatusListener = (hasActiveSubscription: boolean) => void;

export class MyPurchaseController extends PurchaseController {
  private listeners: SubscriptionStatusListener[] = [];

  constructor() {
    super();
    // On app launch, set initial status to UNKNOWN
    Superwall.shared.setSubscriptionStatus(SubscriptionStatus.UNKNOWN);
  }

  addSubscriptionStatusListener(listener: SubscriptionStatusListener) {
    this.listeners.push(listener);
    // Initial check
    this.checkSubscriptionStatus();
  }

  private async checkSubscriptionStatus() {
    try {
      // Ici, implémentez la vérification réelle du statut d'abonnement
      // Pour l'instant, on simule un statut inactif
      const hasActiveSubscription = false;
      this.notifyListeners(hasActiveSubscription);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      this.notifyListeners(false);
    }
  }

  private notifyListeners(hasActiveSubscription: boolean) {
    this.listeners.forEach(listener => {
      listener(hasActiveSubscription);
    });
  }

  async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
    try {
      // Simulation d'achat réussi
      const result = {
        type: 'purchased',
        toJSON: () => ({ type: 'purchased' })
      } as PurchaseResult;
      this.notifyListeners(true);
      return result;
    } catch (error) {
      this.notifyListeners(false);
      return {
        type: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        toJSON: () => ({ type: 'failed', error: 'Unknown error' })
      };
    }
  }

  async purchaseFromGooglePlay(
    productId: string,
    basePlanId: string,
    offerId?: string
  ): Promise<PurchaseResult> {
    try {
      // Simulation d'achat réussi
      const result = {
        type: 'purchased',
        toJSON: () => ({ type: 'purchased' })
      } as PurchaseResult;
      this.notifyListeners(true);
      return result;
    } catch (error) {
      this.notifyListeners(false);
      return {
        type: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        toJSON: () => ({ type: 'failed', error: 'Unknown error' })
      };
    }
  }

  async restorePurchases(): Promise<RestorationResult> {
    try {
      // Simulation de restauration réussie
      this.notifyListeners(true);
      return RestorationResult.restored();
    } catch (error) {
      this.notifyListeners(false);
      return RestorationResult.failed(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async updateSubscriptionStatus(status: SubscriptionStatus, type?: 'monthly' | 'yearly') {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const userRef = firestore().collection('users').doc(userId);
    
    if (status === SubscriptionStatus.ACTIVE) {
      const subscriptionEndDate = type === 'yearly' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await userRef.update({
        subscriptionStatus: type || 'monthly',
        subscriptionStartDate: new Date(),
        subscriptionEndDate,
        lastUpdated: new Date()
      });
    } else {
      // Vérifie si l'utilisateur est encore en période d'essai
      const userData = (await userRef.get()).data() as UserData;
      const isTrialValid = userData?.trialEndDate && new Date(userData.trialEndDate) > new Date();
      
      await userRef.update({
        subscriptionStatus: isTrialValid ? 'trial' : 'free',
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        lastUpdated: new Date()
      });
    }

    // Notifie Superwall
    if (status === SubscriptionStatus.ACTIVE) {
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
    } else {
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.INACTIVE);
    }
  }
} 