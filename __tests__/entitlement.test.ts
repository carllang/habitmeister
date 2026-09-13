import {describe, expect, it, jest} from '@jest/globals';

const mockPresentPaywallIfNeeded = jest.fn(() =>
  Promise.resolve('PURCHASED' as never),
);
const mockPresentCustomerCenter = jest.fn(() => Promise.resolve());

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    LOG_LEVEL: {DEBUG: 'DEBUG'},
    addCustomerInfoUpdateListener: jest.fn(),
    configure: jest.fn(),
    getOfferings: jest.fn(() =>
      Promise.resolve({
        current: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: 'monthly',
              product: {
                identifier: 'premium_monthly',
                title: 'Premium monthly',
                priceString: '$4.99',
              },
            },
            {
              identifier: 'yearly',
              product: {
                identifier: 'premium_yearly',
                title: 'Premium yearly',
                priceString: '$39.99',
              },
            },
          ],
        },
      }),
    ),
    purchasePackage: jest.fn(() =>
      Promise.resolve({
        customerInfo: {entitlements: {active: {habitmeister_pro: {}}}},
      }),
    ),
    removeCustomerInfoUpdateListener: jest.fn(() => true),
    restorePurchases: jest.fn(() =>
      Promise.resolve({entitlements: {active: {habitmeister_pro: {}}}}),
    ),
    getCustomerInfo: jest.fn(() =>
      Promise.resolve({entitlements: {active: {habitmeister_pro: {}}}}),
    ),
    setLogLevel: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {
    presentCustomerCenter: mockPresentCustomerCenter,
    presentPaywallIfNeeded: mockPresentPaywallIfNeeded,
  },
  RevenueCatUI: {
    presentCustomerCenter: mockPresentCustomerCenter,
    presentPaywallIfNeeded: mockPresentPaywallIfNeeded,
  },
  PAYWALL_RESULT: {
    CANCELLED: 'CANCELLED',
    ERROR: 'ERROR',
    NOT_PRESENTED: 'NOT_PRESENTED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
  },
}));

import Purchases from 'react-native-purchases';

import {
  configureRevenueCat,
  entitlementClient,
  PREMIUM_ENTITLEMENT,
  setRevenueCatUIForTesting,
} from '../src/monetization/entitlement';

describe('premium entitlement', () => {
  it('uses the RevenueCat-compatible entitlement key', () => {
    expect(PREMIUM_ENTITLEMENT).toBe('habitmeister_pro');
  });

  it('defaults to the free plan before billing is configured', async () => {
    await expect(entitlementClient.getPremiumEntitlement()).resolves.toBe(
      false,
    );
  });

  it('reads the active premium entitlement after configuration', async () => {
    configureRevenueCat('public-sdk-key');
    await expect(entitlementClient.getPremiumEntitlement()).resolves.toBe(true);
  });

  it('fails closed when RevenueCat cannot load customer info', async () => {
    const getCustomerInfo = Purchases.getCustomerInfo as unknown as {
      mockRejectedValueOnce: (reason: Error) => unknown;
    };
    getCustomerInfo.mockRejectedValueOnce(new Error('network unavailable'));
    await expect(entitlementClient.getPremiumEntitlement()).resolves.toBe(
      false,
    );
  });

  it('normalizes the current offering for the paywall', async () => {
    await expect(entitlementClient.getPremiumOffering()).resolves.toEqual(
      expect.objectContaining({
        identifier: 'default',
        offers: expect.arrayContaining([
          expect.objectContaining({
            identifier: 'monthly',
            price: '$4.99',
            productIdentifier: 'premium_monthly',
            title: 'Premium monthly',
          }),
          expect.objectContaining({
            identifier: 'yearly',
            price: '$39.99',
            productIdentifier: 'premium_yearly',
            title: 'Premium yearly',
          }),
        ]),
      }),
    );
  });

  it('serializes concurrent purchase requests', async () => {
    const purchasePackage = Purchases.purchasePackage as unknown as jest.Mock;
    const offer = await entitlementClient.getPremiumOffer();
    const first = entitlementClient.purchasePremium(offer!);
    const second = entitlementClient.purchasePremium(offer!);

    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({status: 'success'}),
      expect.objectContaining({status: 'success'}),
    ]);
    expect(purchasePackage).toHaveBeenCalledTimes(1);
  });

  it('uses the RevenueCat entitlement when restoring purchases', async () => {
    await expect(entitlementClient.restorePurchases()).resolves.toEqual(
      expect.objectContaining({status: 'success'}),
    );
  });

  it('presents the hosted RevenueCat paywall when needed', async () => {
    setRevenueCatUIForTesting({
      presentCustomerCenter: mockPresentCustomerCenter,
      presentPaywallIfNeeded: mockPresentPaywallIfNeeded,
    });
    await expect(entitlementClient.presentPremiumPaywall()).resolves.toEqual(
      expect.objectContaining({status: 'success'}),
    );
    expect(mockPresentPaywallIfNeeded).toHaveBeenCalledWith({
      requiredEntitlementIdentifier: 'habitmeister_pro',
    });
  });

  it('opens Customer Center and refreshes CustomerInfo', async () => {
    setRevenueCatUIForTesting({
      presentCustomerCenter: mockPresentCustomerCenter,
      presentPaywallIfNeeded: mockPresentPaywallIfNeeded,
    });
    await expect(entitlementClient.showCustomerCenter()).resolves.toEqual(
      expect.objectContaining({status: 'success'}),
    );
    expect(mockPresentCustomerCenter).toHaveBeenCalledTimes(1);
  });
});
