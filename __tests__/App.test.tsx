/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Pressable, Text} from 'react-native';
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
    LOG_LEVEL: {DEBUG: 'DEBUG'},
    addCustomerInfoUpdateListener: () => undefined,
    configure: () => undefined,
    getCustomerInfo: () => Promise.resolve({entitlements: {active: {}}}),
    removeCustomerInfoUpdateListener: () => true,
    setLogLevel: () => Promise.resolve(),
  },
}));

jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {
    presentCustomerCenter: () => Promise.resolve(),
    presentPaywallIfNeeded: () => Promise.resolve('CANCELLED'),
  },
  PAYWALL_RESULT: {
    CANCELLED: 'CANCELLED',
    ERROR: 'ERROR',
    NOT_PRESENTED: 'NOT_PRESENTED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
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
import {expect, it, jest} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

function findPressableByText(
  tree: renderer.ReactTestRenderer,
  text: string,
): renderer.ReactTestInstance {
  return tree.root.find(
    node =>
      node.type === Pressable &&
      node.findAllByType(Text).some(label => label.props.children === text),
  );
}

it('renders correctly', async () => {
  let app: renderer.ReactTestRenderer;

  await act(async () => {
    app = renderer.create(<App />);
  });

  app!.unmount();
});

it('shows the upgrade modal from Stats and routes the CTA to Settings', async () => {
  let app: renderer.ReactTestRenderer;

  await act(async () => {
    app = renderer.create(<App />);
  });

  await act(async () => {
    findPressableByText(app!, 'Begin with my habits').props.onPress();
  });

  await act(async () => {
    findPressableByText(app!, 'Stats').props.onPress();
  });

  const habitRow = app!.root.find(
    node =>
      node.type === Pressable &&
      node.props.accessibilityLabel === 'View statistics for Morning pages',
  );

  await act(async () => {
    habitRow.props.onPress();
  });

  expect(
    app!.root.findAllByType(Text).some(textNode => {
      return textNode.props.children === 'Premium stats';
    }),
  ).toBe(true);

  await act(async () => {
    findPressableByText(app!, 'View Premium').props.onPress();
  });

  expect(
    app!.root.findAllByType(Text).some(textNode => {
      return textNode.props.children === 'Make the routine yours';
    }),
  ).toBe(true);

  app!.unmount();
});
