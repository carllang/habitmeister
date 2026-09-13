export const REVENUECAT_API_KEY = 'test_fzlKWlvREkxjERglxaBLTXgkIhi';
export const REVENUECAT_ENTITLEMENT_ID = 'habitmeister_pro';
export const REVENUECAT_PACKAGE_IDS = {
  lifetime: 'lifetime',
  monthly: 'monthly',
  yearly: 'yearly',
} as const;

// Set to true or false while developing; use null to exercise RevenueCat.
// The test_ RevenueCat key is for development only; do not ship it to Google Play.
export const DEV_PREMIUM_OVERRIDE: boolean | null = null;
