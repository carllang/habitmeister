/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: () => undefined,
    getCustomerInfo: () => Promise.resolve({entitlements: {active: {}}}),
  },
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    cancelTriggerNotification: () => Promise.resolve(),
    createChannel: () => Promise.resolve('habitmeister-reminders'),
    createTriggerNotification: () => Promise.resolve('notification-id'),
    requestPermission: () => Promise.resolve({authorizationStatus: 1}),
  },
  AndroidImportance: {HIGH: 4},
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
  RepeatFrequency: {DAILY: 2},
  TriggerType: {TIMESTAMP: 0},
}));

// Note: import explicitly to use the types shipped with jest.
import {it, jest} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

it('renders correctly', async () => {
  let app: renderer.ReactTestRenderer;

  await act(async () => {
    app = renderer.create(<App />);
  });

  app!.unmount();
});
