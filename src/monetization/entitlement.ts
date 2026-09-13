import Purchases from 'react-native-purchases';
import type {
  CustomerInfo,
  CustomerInfoUpdateListener,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, {PAYWALL_RESULT} from 'react-native-purchases-ui';

import {REVENUECAT_ENTITLEMENT_ID} from '../config';

export const PREMIUM_ENTITLEMENT = REVENUECAT_ENTITLEMENT_ID;

export type BillingResult = {
  customerInfo?: CustomerInfo;
  message?: string;
  status: 'cancelled' | 'error' | 'notConfigured' | 'success';
};

export type PremiumOffer = {
  identifier: string;
  package: PurchasesPackage;
  price: string;
  productIdentifier: string;
  title: string;
};

export type PremiumOffering = {
  identifier: string;
  offering: PurchasesOffering;
  offers: PremiumOffer[];
};

type RevenueCatUIMethods = {
  presentCustomerCenter: () => Promise<void>;
  presentPaywallIfNeeded: (params: {
    requiredEntitlementIdentifier: string;
  }) => Promise<PAYWALL_RESULT>;
};

export type EntitlementClient = {
  getCustomerInfo: () => Promise<CustomerInfo | null>;
  getPremiumEntitlement: () => Promise<boolean>;
  getPremiumOffer: () => Promise<PremiumOffer | null>;
  getPremiumOffering: () => Promise<PremiumOffering | null>;
  presentPremiumPaywall: () => Promise<BillingResult>;
  purchasePremium: (offer: PremiumOffer) => Promise<BillingResult>;
  restorePurchases: () => Promise<BillingResult>;
  showCustomerCenter: () => Promise<BillingResult>;
  subscribeToCustomerInfo: (
    listener: CustomerInfoUpdateListener,
  ) => () => boolean;
};

const BILLING_CANCELLED: BillingResult = {status: 'cancelled'};
const BILLING_NOT_CONFIGURED: BillingResult = {status: 'notConfigured'};

let billingOperation: Promise<BillingResult> | null = null;
let isConfigured = false;
let revenueCatUI: RevenueCatUIMethods = RevenueCatUI;

export function setRevenueCatUIForTesting(ui: RevenueCatUIMethods): void {
  revenueCatUI = ui;
}

function hasPremiumEntitlement(customerInfo: CustomerInfo | null): boolean {
  return Boolean(customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT]);
}

function normalizeOffer(revenueCatPackage: PurchasesPackage): PremiumOffer {
  const product = revenueCatPackage.product;
  return {
    identifier: revenueCatPackage.identifier,
    package: revenueCatPackage,
    price: product.priceString,
    productIdentifier: product.identifier,
    title: product.title || product.identifier,
  };
}

function resultFromCustomerInfo(customerInfo: CustomerInfo): BillingResult {
  return hasPremiumEntitlement(customerInfo)
    ? {customerInfo, status: 'success'}
    : {
        customerInfo,
        message: 'No active Premium purchase was found.',
        status: 'error',
      };
}

async function refreshCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function configureRevenueCat(apiKey: string): void {
  if (!apiKey || isConfigured) {
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG).catch(() => undefined);
    }
    Purchases.configure({apiKey});
    isConfigured = true;
  } catch {
    isConfigured = false;
  }
}

export const entitlementClient: EntitlementClient = {
  getCustomerInfo: async () => {
    if (!isConfigured) {
      return null;
    }

    return refreshCustomerInfo();
  },
  getPremiumEntitlement: async () => {
    if (!isConfigured) {
      return false;
    }

    return hasPremiumEntitlement(await refreshCustomerInfo());
  },
  getPremiumOffer: async () => {
    const offering = await entitlementClient.getPremiumOffering();
    return offering?.offers[0] ?? null;
  },
  getPremiumOffering: async () => {
    if (!isConfigured) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const offering = offerings.current;
      if (!offering || offering.availablePackages.length === 0) {
        return null;
      }

      return {
        identifier: offering.identifier,
        offering,
        offers: offering.availablePackages.map(normalizeOffer),
      };
    } catch {
      return null;
    }
  },
  presentPremiumPaywall: () => {
    if (!isConfigured) {
      return Promise.resolve(BILLING_NOT_CONFIGURED);
    }
    if (billingOperation !== null) {
      return billingOperation;
    }

    billingOperation = revenueCatUI
      .presentPaywallIfNeeded({
        requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT,
      })
      .then(async (paywallResult): Promise<BillingResult> => {
        if (paywallResult === PAYWALL_RESULT.NOT_PRESENTED) {
          const customerInfo = await refreshCustomerInfo();
          return {customerInfo: customerInfo ?? undefined, status: 'success'};
        }

        if (
          paywallResult === PAYWALL_RESULT.PURCHASED ||
          paywallResult === PAYWALL_RESULT.RESTORED
        ) {
          const customerInfo = await refreshCustomerInfo();
          return hasPremiumEntitlement(customerInfo)
            ? {customerInfo: customerInfo ?? undefined, status: 'success'}
            : {
                customerInfo: customerInfo ?? undefined,
                message: 'Premium purchase could not be verified.',
                status: 'error',
              };
        }

        if (paywallResult === PAYWALL_RESULT.CANCELLED) {
          return BILLING_CANCELLED;
        }

        return {
          message: 'Premium is temporarily unavailable. Try again later.',
          status: 'error',
        };
      })
      .catch(
        (): BillingResult => ({
          message: 'Premium is temporarily unavailable. Try again later.',
          status: 'error',
        }),
      )
      .finally(() => {
        billingOperation = null;
      });
    return billingOperation;
  },
  purchasePremium: offer => {
    if (!isConfigured) {
      return Promise.resolve(BILLING_NOT_CONFIGURED);
    }
    if (billingOperation !== null) {
      return billingOperation;
    }

    billingOperation = Purchases.purchasePackage(offer.package)
      .then(result => resultFromCustomerInfo(result.customerInfo))
      .catch(
        (error): BillingResult =>
          error?.userCancelled
            ? BILLING_CANCELLED
            : {
                message: 'Purchase was not completed. No changes were made.',
                status: 'error',
              },
      )
      .finally(() => {
        billingOperation = null;
      });
    return billingOperation;
  },
  restorePurchases: () => {
    if (!isConfigured) {
      return Promise.resolve(BILLING_NOT_CONFIGURED);
    }
    if (billingOperation !== null) {
      return billingOperation;
    }

    billingOperation = Purchases.restorePurchases()
      .then(customerInfo => resultFromCustomerInfo(customerInfo))
      .catch(
        (): BillingResult => ({
          message: 'Unable to restore purchases. Try again later.',
          status: 'error',
        }),
      )
      .finally(() => {
        billingOperation = null;
      });
    return billingOperation;
  },
  showCustomerCenter: async () => {
    if (!isConfigured) {
      return BILLING_NOT_CONFIGURED;
    }

    try {
      await revenueCatUI.presentCustomerCenter();
      const customerInfo = await refreshCustomerInfo();
      return hasPremiumEntitlement(customerInfo)
        ? {customerInfo: customerInfo ?? undefined, status: 'success'}
        : {customerInfo: customerInfo ?? undefined, status: 'error'};
    } catch {
      return {
        message: 'Subscription management is temporarily unavailable.',
        status: 'error',
      };
    }
  },
  subscribeToCustomerInfo: listener => {
    if (!isConfigured) {
      return () => false;
    }

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => Purchases.removeCustomerInfoUpdateListener(listener);
  },
};
