import notifee from '@notifee/react-native';
import {describe, expect, it, jest} from '@jest/globals';
import {
  cancelReminder,
  getNextReminderDate,
  getReminderNotificationId,
  parseReminderTime,
  scheduleReminder,
} from '../src/notifications/reminderService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  },
}));

jest.mock('@notifee/react-native', () => {
  const {jest: jestApi} = require('@jest/globals');
  return {
    __esModule: true,
    default: {
      cancelTriggerNotification: jestApi.fn(() => Promise.resolve()),
      createChannel: jestApi.fn(() =>
        Promise.resolve('habitmeister-reminders'),
      ),
      createTriggerNotification: jestApi.fn(() =>
        Promise.resolve('notification-id'),
      ),
      requestPermission: jestApi.fn(() =>
        Promise.resolve({authorizationStatus: 1}),
      ),
    },
    AndroidImportance: {HIGH: 4},
    AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
    RepeatFrequency: {DAILY: 2, WEEKLY: 3},
    TriggerType: {TIMESTAMP: 0},
  };
});

describe('reminder service', () => {
  it('parses only strict 24-hour reminder times', () => {
    expect(parseReminderTime('08:05')).toEqual({hours: 8, minutes: 5});
    expect(parseReminderTime('8:05')).toBeNull();
    expect(parseReminderTime('24:00')).toBeNull();
  });

  it('uses a stable per-habit notification ID', () => {
    expect(getReminderNotificationId(42)).toBe('habitmeister-reminder-42');
  });

  it('moves a passed reminder to the next local day', () => {
    const now = new Date(2026, 8, 5, 14, 30);
    const next = getNextReminderDate({hours: 14, minutes: 0}, now);
    expect(next).toEqual(new Date(2026, 8, 6, 14, 0));
  });

  it('schedules by replacing the existing habit trigger', async () => {
    await scheduleReminder(
      {id: 7, name: 'Read', reminderTime: '15:00'},
      new Date(2026, 8, 5, 14, 30),
    );

    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith(
      'habitmeister-reminder-7',
    );
    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'habitmeister-reminder-7',
        body: 'Read',
      }),
      expect.objectContaining({
        timestamp: new Date(2026, 8, 5, 15, 0).getTime(),
      }),
    );
  });

  it('schedules one weekly trigger per selected weekday', async () => {
    await scheduleReminder(
      {id: 11, name: 'Run', reminderTime: '08:00', repeatDays: ['Mon', 'Wed']},
      new Date(2026, 8, 5, 14, 30),
    );

    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({id: 'habitmeister-reminder-11-Mon'}),
      expect.objectContaining({repeatFrequency: 3}),
    );
    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({id: 'habitmeister-reminder-11-Wed'}),
      expect.objectContaining({repeatFrequency: 3}),
    );
  });

  it('cancels reminders when the time is missing or invalid', async () => {
    await scheduleReminder({id: 8, name: 'Stretch'});
    await scheduleReminder({id: 9, name: 'Stretch', reminderTime: '25:00'});
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith(
      'habitmeister-reminder-8',
    );
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith(
      'habitmeister-reminder-9',
    );
  });

  it('swallows cancellation failures', async () => {
    const cancelTriggerNotification =
      notifee.cancelTriggerNotification as unknown as {
        mockRejectedValueOnce: (error: Error) => unknown;
      };
    cancelTriggerNotification.mockRejectedValueOnce(new Error('not available'));
    await expect(cancelReminder(10)).resolves.toBeUndefined();
  });
});
