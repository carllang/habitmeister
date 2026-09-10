import {
  getDateKey,
  getHabitStreak,
  Habit,
  isHabitComplete,
  isHabitScheduledOnDate,
} from './habitRepository';

export type HabitStats = {
  currentStreak: number;
  bestStreak: number;
  scheduledDays: number;
  completedScheduledDays: number;
  completionRate: number;
};

export type WeeklyTrend = {
  completed: number;
  label: string;
  scheduled: number;
};

function getDatesEndingAt(endDate: Date, dayCount: number): Date[] {
  return Array.from({length: dayCount}, (_, index) => {
    const date = new Date(endDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(endDate.getDate() - (dayCount - index - 1));
    return date;
  });
}

export function getHabitStats(
  habit: Habit,
  endDate = new Date(),
  dayCount = 30,
): HabitStats {
  const dates = getDatesEndingAt(endDate, dayCount);
  const scheduledDays = dates.filter(date =>
    isHabitScheduledOnDate(habit, date),
  );
  const completedScheduledDays = scheduledDays.filter(date =>
    isHabitComplete(habit, date),
  ).length;
  const completionRate = scheduledDays.length
    ? Math.round((completedScheduledDays / scheduledDays.length) * 100)
    : 0;

  return {
    currentStreak: getHabitStreak(habit, endDate),
    bestStreak: getBestStreak(habit, dates),
    scheduledDays: scheduledDays.length,
    completedScheduledDays,
    completionRate,
  };
}

export function getBestStreak(habit: Habit, dates: Date[]): number {
  let best = 0;
  let current = 0;

  dates.forEach(date => {
    if (isHabitComplete(habit, date)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });

  return best;
}

export function getWeeklyTrend(
  habits: Habit[],
  endDate = new Date(),
  weekCount = 4,
): WeeklyTrend[] {
  return Array.from({length: weekCount}, (_, index) => {
    const weekEnd = new Date(endDate);
    weekEnd.setHours(0, 0, 0, 0);
    weekEnd.setDate(endDate.getDate() - (weekCount - index - 1) * 7);
    const dates = getDatesEndingAt(weekEnd, 7);
    let scheduled = 0;
    let completed = 0;

    habits.forEach(habit => {
      dates.forEach(date => {
        if (isHabitScheduledOnDate(habit, date)) {
          scheduled += 1;
          if (isHabitComplete(habit, date)) {
            completed += 1;
          }
        }
      });
    });

    return {
      completed,
      label: dates[0].toLocaleDateString(undefined, {month: 'short'}),
      scheduled,
    };
  });
}

export function getOverallStats(
  habits: Habit[],
  endDate = new Date(),
  dayCount = 30,
): HabitStats {
  const dates = getDatesEndingAt(endDate, dayCount);
  let scheduledDays = 0;
  let completedScheduledDays = 0;

  habits.forEach(habit => {
    dates.forEach(date => {
      if (isHabitScheduledOnDate(habit, date)) {
        scheduledDays += 1;
        if (isHabitComplete(habit, date)) {
          completedScheduledDays += 1;
        }
      }
    });
  });

  return {
    currentStreak: habits.length
      ? Math.min(...habits.map(habit => getHabitStreak(habit, endDate)))
      : 0,
    bestStreak: habits.length
      ? Math.max(
          ...habits.map(
            habit => getHabitStats(habit, endDate, dayCount).bestStreak,
          ),
        )
      : 0,
    scheduledDays,
    completedScheduledDays,
    completionRate: scheduledDays
      ? Math.round((completedScheduledDays / scheduledDays) * 100)
      : 0,
  };
}

export function getStatsDateKey(date: Date): string {
  return getDateKey(date);
}
