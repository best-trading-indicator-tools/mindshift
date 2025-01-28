import Superwall from '@superwall/react-native-superwall';
import { PurchaseController, PurchaseResult, RestorationResult, SubscriptionStatus } from '@superwall/react-native-superwall';

export class MyPurchaseController extends PurchaseController {
  async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
    try {
      // Pour l'instant, simulons un achat réussi
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
      return {
        type: 'purchased',
        toJSON: () => ({ type: 'purchased' })
      };
    } catch (error) {
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.INACTIVE);
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
      // Pour l'instant, simulons un achat réussi
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
      return {
        type: 'purchased',
        toJSON: () => ({ type: 'purchased' })
      };
    } catch (error) {
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.INACTIVE);
      return {
        type: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        toJSON: () => ({ type: 'failed', error: 'Unknown error' })
      };
    }
  }

  async restorePurchases(): Promise<RestorationResult> {
    try {
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
      return RestorationResult.restored();
    } catch (error) {
      Superwall.shared.setSubscriptionStatus(SubscriptionStatus.INACTIVE);
      return RestorationResult.failed(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
} 