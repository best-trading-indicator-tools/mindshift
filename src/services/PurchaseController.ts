import Superwall from '@superwall/react-native-superwall';
import { PurchaseController, PurchaseResult, RestorationResult, SubscriptionStatus } from '@superwall/react-native-superwall';
import { auth, firestore, UserData } from '../services/firebase';
import {
  initConnection,
  requestSubscription,
  getSubscriptions,
  finishTransaction,
  PurchaseError,
  validateReceiptIos,
  validateReceiptAndroid,
  getAvailablePurchases,
  Subscription,
  SubscriptionPurchase,
  PurchaseResult as IAPPurchaseResult,
  ProductPurchase,
  SubscriptionOffer,
} from 'react-native-iap';
import { Platform } from 'react-native';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SubscriptionStatusListener = (hasActiveSubscription: boolean) => void;

interface ExtendedPurchase extends ProductPurchase {
  expirationDate?: string;
  expiryTimeMillis?: string;
}

// Product IDs should match your App Store Connect / Google Play Console products
const SUBSCRIPTION_SKUS = Platform.select({
  ios: ['com.mindshift.subscription.monthly', 'com.mindshift.subscription.annual'],
  android: ['com.mindshift.subscription.monthly', 'com.mindshift.subscription.annual'],
  default: []
}) as string[];

const SUBSCRIPTION_STATUS_KEY = '@subscription_status';
const SUBSCRIPTION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24h en millisecondes

export class MyPurchaseController extends PurchaseController {
  private listeners: SubscriptionStatusListener[] = [];
  private lastCheckTimestamp: number = 0;

  constructor() {
    super();
    this.initializeIAP();
    Superwall.shared.setSubscriptionStatus(SubscriptionStatus.UNKNOWN);
  }

  private async initializeIAP() {
    try {
      await initConnection();
      const subscriptions = await getSubscriptions({
        skus: SUBSCRIPTION_SKUS
      });
      console.log('Available subscriptions:', subscriptions);
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
    }
  }

  addSubscriptionStatusListener(listener: SubscriptionStatusListener) {
    this.listeners.push(listener);
    this.getStoredSubscriptionStatus().then(status => {
      listener(status);
    });
  }

  private async getStoredSubscriptionStatus(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
      return status === 'true';
    } catch (error) {
      console.error('Failed to get stored subscription status:', error);
      return false;
    }
  }

  private async setStoredSubscriptionStatus(hasActiveSubscription: boolean) {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, String(hasActiveSubscription));
      this.lastCheckTimestamp = Date.now();
    } catch (error) {
      console.error('Failed to store subscription status:', error);
    }
  }

  async checkSubscriptionStatus(forceCheck: boolean = false) {
    const shouldCheck = forceCheck || 
      (Date.now() - this.lastCheckTimestamp) > SUBSCRIPTION_CHECK_INTERVAL;

    if (!shouldCheck) {
      const storedStatus = await this.getStoredSubscriptionStatus();
      this.notifyListeners(storedStatus);
      return storedStatus;
    }

    try {
      const purchases = await getAvailablePurchases();
      const hasActiveSubscription = purchases.some((purchase: ExtendedPurchase) => {
        if (Platform.OS === 'ios' && purchase.expirationDate) {
          return new Date(purchase.expirationDate) > new Date();
        }
        if (Platform.OS === 'android' && purchase.expiryTimeMillis) {
          return new Date(Number(purchase.expiryTimeMillis)) > new Date();
        }
        return false;
      });
      
      await this.setStoredSubscriptionStatus(hasActiveSubscription);
      this.notifyListeners(hasActiveSubscription);
      return hasActiveSubscription;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      const storedStatus = await this.getStoredSubscriptionStatus();
      this.notifyListeners(storedStatus);
      return storedStatus;
    }
  }

  private notifyListeners(hasActiveSubscription: boolean) {
    this.listeners.forEach(listener => listener(hasActiveSubscription));
  }

  async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
    try {
      const purchase = await requestSubscription({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
        subscriptionOffers: [{
          offerToken: productId,
          sku: productId
        }]
      });
      
      if (purchase && 'transactionReceipt' in purchase) {
        const receipt = await validateReceiptIos({
          receiptBody: {
            'receipt-data': purchase.transactionReceipt,
            password: Config.APP_STORE_SHARED_SECRET || ''
          },
        });

        if (purchase.transactionId) {
          await finishTransaction({
            purchase,
            isConsumable: false
          });
        }

        const type = productId.includes('yearly') ? 'yearly' : 'monthly';
        await this.updateSubscriptionStatus(SubscriptionStatus.ACTIVE, type);

        return {
          type: 'purchased',
          toJSON: () => ({ type: 'purchased' })
        } as PurchaseResult;
      }
      
      throw new Error('No transaction receipt');
    } catch (error) {
      console.error('App Store purchase failed:', error);
      const purchaseError = error as PurchaseError;
      return {
        type: 'failed',
        error: purchaseError.message || 'Purchase failed',
        toJSON: () => ({ type: 'failed', error: purchaseError.message })
      };
    }
  }

  async purchaseFromGooglePlay(
    productId: string,
    basePlanId: string,
    offerId?: string
  ): Promise<PurchaseResult> {
    // For now, return a failed result since Android implementation is pending
    return {
      type: 'failed',
      error: 'Android purchases not yet implemented',
      toJSON: () => ({ 
        type: 'failed', 
        error: 'Android purchases not yet implemented' 
      })
    };
  }

  async restorePurchases(): Promise<RestorationResult> {
    try {
      const purchases = await getAvailablePurchases();
      const validPurchase = purchases.find((purchase: ExtendedPurchase) => {
        if (Platform.OS === 'ios' && purchase.expirationDate) {
          return new Date(purchase.expirationDate) > new Date();
        }
        if (Platform.OS === 'android' && purchase.expiryTimeMillis) {
          return new Date(Number(purchase.expiryTimeMillis)) > new Date();
        }
        return false;
      });

      if (validPurchase) {
        const type = validPurchase.productId.includes('yearly') ? 'yearly' : 'monthly';
        await this.updateSubscriptionStatus(SubscriptionStatus.ACTIVE, type);
        return RestorationResult.restored();
      }
      
      return RestorationResult.failed(new Error('No valid subscription found'));
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return RestorationResult.failed(
        error instanceof Error ? error : new Error('Failed to restore purchases')
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

    await this.setStoredSubscriptionStatus(status === SubscriptionStatus.ACTIVE);
  }
} 