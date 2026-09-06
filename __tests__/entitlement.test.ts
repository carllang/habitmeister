import {describe, expect, it, jest} from '@jest/globals';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(() =>
      Promise.resolve({
        current: {
          availablePackages: [
            {
              identifier: 'monthly',
              product: {
                identifier: 'premium_monthly',
                title: 'Premium monthly',
                priceString: '$4.99',
              },
            },
          ],
        },
      }),
    ),
    purchasePackage: jest.fn(() =>
      Promise.resolve({
        customerInfo: {entitlements: {active: {premium: {}}}},
      }),
    ),
    restorePurchases: jest.fn(() =>
      Promise.resolve({entitlements: {active: {premium: {}}}}),
    ),
    getCustomerInfo: jest.fn(() =>
      Promise.resolve({entitlements: {active: {premium: {}}}}),
    ),
  },
}));

import Purchases from 'react-native-purchases';

import {
  configureRevenueCat,
  entitlementClient,
  PREMIUM_ENTITLEMENT,
} from '../src/monetization/entitlement';

describe('premium entitlement', () => {
  it('uses the RevenueCat-compatible entitlement key', () => {
    expect(PREMIUM_ENTITLEMENT).toBe('premium');
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
    await expect(entitlementClient.getPremiumOffer()).resolves.toEqual(
      expect.objectContaining({
        identifier: 'monthly',
        title: 'Premium monthly',
        price: '$4.99',
      }),
    );
  });

  it('serializes concurrent purchase requests', async () => {
    const purchasePackage = Purchases.purchasePackage as unknown as jest.Mock;
    const offer = await entitlementClient.getPremiumOffer();
    const first = entitlementClient.purchasePremium(offer!);
    const second = entitlementClient.purchasePremium(offer!);

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(purchasePackage).toHaveBeenCalledTimes(1);
  });

  it('uses the RevenueCat entitlement when restoring purchases', async () => {
    await expect(entitlementClient.restorePurchases()).resolves.toBe(true);
  });
});
