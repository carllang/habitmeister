import {describe, expect, it, jest} from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  },
}));

import {
  getHabitStats,
  getOverallStats,
  getWeeklyTrend,
} from '../src/data/habitStats';
import {Habit, WEEKDAYS} from '../src/data/habitRepository';

const habit: Habit = {
  id: 1,
  name: 'Read',
  detail: '20 pages',
  completed: true,
  color: '#286B69',
  completedDates: ['2026-09-01', '2026-09-02', '2026-09-04'],
  repeatDays: [...WEEKDAYS],
};

describe('habit statistics', () => {
  it('calculates scheduled completion percentage and streaks', () => {
    const stats = getHabitStats(habit, new Date(2026, 8, 4), 4);

    expect(stats.scheduledDays).toBe(4);
    expect(stats.completedScheduledDays).toBe(3);
    expect(stats.completionRate).toBe(75);
    expect(stats.currentStreak).toBe(1);
    expect(stats.bestStreak).toBe(2);
  });

  it('respects repeat days when calculating scheduled completion', () => {
    const weekdayHabit = {
      ...habit,
      repeatDays: ['Tue', 'Thu'] as Habit['repeatDays'],
      completedDates: ['2026-09-01', '2026-09-03'],
    };
    const stats = getHabitStats(weekdayHabit, new Date(2026, 8, 4), 4);

    expect(stats.scheduledDays).toBe(2);
    expect(stats.completedScheduledDays).toBe(2);
    expect(stats.completionRate).toBe(100);
  });

  it('returns zero overall stats for no habits', () => {
    expect(getOverallStats([], new Date(2026, 8, 4))).toEqual({
      currentStreak: 0,
      bestStreak: 0,
      scheduledDays: 0,
      completedScheduledDays: 0,
      completionRate: 0,
    });
  });

  it('returns weekly trend buckets', () => {
    const trend = getWeeklyTrend([habit], new Date(2026, 8, 4), 2);

    expect(trend).toHaveLength(2);
    expect(trend.every(week => week.scheduled === 7)).toBe(true);
    expect(trend[1].completed).toBe(3);
  });
});
