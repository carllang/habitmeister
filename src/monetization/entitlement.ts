import Purchases from 'react-native-purchases';
import type {PurchasesPackage} from 'react-native-purchases';

export const PREMIUM_ENTITLEMENT = 'premium';

export type PremiumOffer = {
  identifier: string;
  title: string;
  price: string;
  package: PurchasesPackage;
};

export type EntitlementClient = {
  getPremiumEntitlement: () => Promise<boolean>;
  getPremiumOffer: () => Promise<PremiumOffer | null>;
  purchasePremium: (offer: PremiumOffer) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
};

let isConfigured = false;
let billingOperation: Promise<boolean> | null = null;

export function configureRevenueCat(apiKey: string): void {
  if (!apiKey || isConfigured) {
    return;
  }

  try {
    Purchases.configure({apiKey});
    isConfigured = true;
  } catch {
    isConfigured = false;
  }
}

export const entitlementClient: EntitlementClient = {
  getPremiumEntitlement: async () => {
    if (!isConfigured) {
      return false;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]);
    } catch {
      return false;
    }
  },
  getPremiumOffer: async () => {
    if (!isConfigured) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const offering = offerings.current;
      const premiumPackage = offering?.availablePackages[0];
      if (!premiumPackage) {
        return null;
      }

      const product = premiumPackage.product;
      return {
        identifier: premiumPackage.identifier,
        title: product.title || product.identifier,
        price: product.priceString,
        package: premiumPackage,
      };
    } catch {
      return null;
    }
  },
  purchasePremium: offer => {
    if (!isConfigured) {
      return Promise.resolve(false);
    }
    if (billingOperation) {
      return billingOperation;
    }

    billingOperation = Purchases.purchasePackage(offer.package)
      .then(result =>
        Boolean(result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]),
      )
      .catch(() => false)
      .finally(() => {
        billingOperation = null;
      });
    return billingOperation;
  },
  restorePurchases: () => {
    if (!isConfigured) {
      return Promise.resolve(false);
    }
    if (billingOperation) {
      return billingOperation;
    }

    billingOperation = Purchases.restorePurchases()
      .then(customerInfo =>
        Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]),
      )
      .catch(() => false)
      .finally(() => {
        billingOperation = null;
      });
    return billingOperation;
  },
};
