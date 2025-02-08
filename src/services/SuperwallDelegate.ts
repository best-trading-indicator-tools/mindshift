import { 
  SuperwallDelegate, 
  SuperwallOptions, 
  SubscriptionStatus, 
  SuperwallEventInfo, 
  PaywallInfo
} from '@superwall/react-native-superwall';
import Superwall from '@superwall/react-native-superwall';
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

class MySuperWallDelegate implements SuperwallDelegate {
  // Méthodes requises par SuperwallDelegate
  subscriptionStatusDidChange(to: SubscriptionStatus): void {
    if (to === SubscriptionStatus.ACTIVE) {
      // Attendre un court instant pour laisser le state se stabiliser
      console.log("Subscription status changed to ACTIVE");
      setTimeout(() => {
        // Fermer d'abord le paywall
        Superwall.shared.dismiss();
        // Puis attendre un peu avant de naviguer
        setTimeout(() => {
          if (navigationRef.isReady()) {
            console.log("Navigating to PostQuestionnaire");
            navigationRef.navigate('PostQuestionnaire');
          }
        }, 100);
      }, 100);
    }
  }
  handleSuperwallEvent(withInfo: SuperwallEventInfo): void {}
  willPresentPaywall(paywallInfo: PaywallInfo): void {}
  didPresentPaywall(paywallInfo: PaywallInfo): void {}
  paywallWillOpenURL(url: URL): void {}
  paywallWillOpenDeepLink(url: URL): void {}
  handleLog(level: string, scope: string, message: string): void {}

  // Gestion des actions personnalisées du paywall
  handleCustomPaywallAction(name: string): void {
    if (name === "close") {
      // Navigation vers Login en utilisant navigationRef
      console.log("Superwall delegate close action");
      if (navigationRef.isReady()) {
        navigationRef.navigate('Login');
      }
    }
  }

  willDismissPaywall(paywallInfo: PaywallInfo): void {}
  didDismissPaywall(paywallInfo: PaywallInfo): void {}
}

// Exporter une instance du delegate
export const delegate = new MySuperWallDelegate();

export const createSuperwallOptions = () => {
  const options = {
    paywalls: {
      shouldShowPurchaseFailureAlert: true,
      shouldPreload: true,
      automaticallyDismiss: true
    },
    networkEnvironment: 'PRODUCTION',
    isExternalDataCollectionEnabled: true,
    isGameControllerEnabled: false,
    isDebugMode: __DEV__,
    logging: {
      level: 'DEBUG',
      scopes: ['all']
    },
    toJson: function() {
      return JSON.stringify(this);
    }
  };

  return options as unknown as SuperwallOptions;
}; 