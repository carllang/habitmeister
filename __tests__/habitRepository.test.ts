import {
  getDateKey,
  getHabitStreak,
  isHabitComplete,
  isHabitScheduledOnDate,
  Habit,
  clearLocalHabitData,
  isValidReminderTime,
  loadHabits,
  loadOnboardingCompleted,
  loadRemindersEnabled,
  normalizeRepeatDays,
  normalizeTimeOfDay,
  WEEKDAYS,
  Weekday,
  saveHabits,
  saveOnboardingCompleted,
  saveRemindersEnabled,
  toggleHabitCompletionOnDate,
} from '../src/data/habitRepository';
import {describe, expect, it, jest} from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  },
}));

const mockedStorage = (
  jest.requireMock('@react-native-async-storage/async-storage') as {
    default: {
      getItem: () => Promise<null | string>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    };
  }
).default;
const mockGetItem = jest.spyOn(mockedStorage, 'getItem');
const mockSetItem = jest.spyOn(mockedStorage, 'setItem');
const mockRemoveItem = jest.spyOn(mockedStorage, 'removeItem');

describe('habit completion history', () => {
  const habit: Habit = {
    id: 1,
    name: 'Read',
    detail: '20 pages',
    completed: false,
    color: '#286B69',
    completedDates: ['2026-09-02', '2026-09-01'],
    repeatDays: [...WEEKDAYS],
  };

  it('creates local date keys without time-zone conversion', () => {
    expect(getDateKey(new Date(2026, 8, 2))).toBe('2026-09-02');
  });

  it('checks completion and calculates consecutive streaks', () => {
    const today = new Date(2026, 8, 2);
    expect(isHabitComplete(habit, today)).toBe(true);
    expect(getHabitStreak(habit, today)).toBe(2);
  });

  it('toggles only the selected date and preserves the rest of history', () => {
    const selectedDate = new Date(2026, 8, 3);
    const updated = toggleHabitCompletionOnDate(habit, selectedDate);

    expect(updated.completedDates).toEqual([
      '2026-09-02',
      '2026-09-01',
      '2026-09-03',
    ]);

    const toggledAgain = toggleHabitCompletionOnDate(updated, selectedDate);
    expect(toggledAgain.completedDates).toEqual(['2026-09-02', '2026-09-01']);
  });

  it('does not duplicate an existing selected date', () => {
    const updated = toggleHabitCompletionOnDate(habit, new Date(2026, 8, 2));

    expect(updated.completedDates).toEqual(['2026-09-01']);
  });

  it('returns no streak when today is incomplete', () => {
    expect(getHabitStreak(habit, new Date(2026, 8, 3))).toBe(0);
  });

  it('does not treat a legacy completed flag as today completion', () => {
    const completedYesterday = {
      ...habit,
      completed: true,
      completedDates: ['2026-09-01'],
    };
    expect(isHabitComplete(completedYesterday, new Date(2026, 8, 2))).toBe(
      false,
    );
  });

  it('ignores malformed saved habits and normalizes valid records', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 2));
    try {
      mockGetItem.mockResolvedValueOnce(
        JSON.stringify([
          null,
          {id: 2, name: '  Stretch  ', completedDates: ['2026-09-02']},
        ]),
      );
      await expect(loadHabits()).resolves.toEqual([
        expect.objectContaining({
          id: 2,
          name: 'Stretch',
          detail: 'Daily',
          completed: true,
          completedDates: ['2026-09-02'],
        }),
      ]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not reject when local storage writes fail', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(saveHabits([habit])).resolves.toBeUndefined();
    mockSetItem.mockResolvedValue(undefined);
  });

  it('accepts only valid 24-hour reminder times', () => {
    expect(isValidReminderTime('08:05')).toBe(true);
    expect(isValidReminderTime('24:00')).toBe(false);
    expect(isValidReminderTime('8:05')).toBe(false);
  });

  it('defaults legacy habits to every weekday and removes invalid duplicates', () => {
    expect(normalizeRepeatDays(undefined)).toEqual([...WEEKDAYS]);
    expect(normalizeRepeatDays(['Mon', 'Mon', 'NotADay'])).toEqual(['Mon']);
    expect(normalizeRepeatDays([])).toEqual([...WEEKDAYS]);
  });

  it('normalizes optional habit metadata while preserving legacy defaults', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: 3,
          name: '  Walk  ',
          timeOfDay: 'morning',
          location: '  Park ',
          durationMinutes: 30,
          presetId: 'movement',
        },
      ]),
    );

    await expect(loadHabits()).resolves.toEqual([
      expect.objectContaining({
        timeOfDay: 'morning',
        location: 'Park',
        durationMinutes: 30,
        presetId: 'movement',
      }),
    ]);
    expect(normalizeTimeOfDay('night')).toBeUndefined();
  });

  it('checks whether a habit is scheduled for a local date', () => {
    const weekdaysOnly = {
      ...habit,
      repeatDays: ['Mon', 'Wed'] as Weekday[],
    };
    expect(isHabitScheduledOnDate(weekdaysOnly, new Date(2026, 8, 7))).toBe(
      true,
    );
    expect(isHabitScheduledOnDate(weekdaysOnly, new Date(2026, 8, 8))).toBe(
      false,
    );
  });

  it('defaults onboarding to incomplete and can persist completion', async () => {
    await expect(loadOnboardingCompleted()).resolves.toBe(false);
    await expect(saveOnboardingCompleted()).resolves.toBeUndefined();
  });

  it('defaults reminders to disabled and persists the preference', async () => {
    await expect(loadRemindersEnabled()).resolves.toBe(false);
    await saveRemindersEnabled(false);
    expect(mockSetItem).toHaveBeenCalledWith(
      '@habitmeister/reminders-enabled',
      'false',
    );
  });

  it('clears local habits and onboarding state', async () => {
    await clearLocalHabitData();

    expect(mockSetItem).toHaveBeenCalledWith('@habitmeister/habits', '[]');
    expect(mockRemoveItem).toHaveBeenCalledWith(
      '@habitmeister/onboarding-completed',
    );
  });
});
