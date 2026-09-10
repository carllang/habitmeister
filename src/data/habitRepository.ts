import AsyncStorage from '@react-native-async-storage/async-storage';

export type Habit = {
  id: number;
  name: string;
  detail: string;
  completed: boolean;
  color: string;
  timeOfDay?: TimeOfDay;
  location?: string;
  durationMinutes?: number;
  presetId?: string;
  completedDates: string[];
  repeatDays: Weekday[];
  reminderTime?: string;
};

export const TIMES_OF_DAY = ['morning', 'afternoon', 'evening'] as const;

export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export const WEEKDAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

const WEEKDAY_SET = new Set<string>(WEEKDAYS);
const TIME_OF_DAY_SET = new Set<string>(TIMES_OF_DAY);

export function normalizeRepeatDays(value: unknown): Weekday[] {
  if (!Array.isArray(value)) {
    return [...WEEKDAYS];
  }

  const days = value.filter(
    (day): day is Weekday => typeof day === 'string' && WEEKDAY_SET.has(day),
  );
  return days.length > 0 ? [...new Set(days)] : [...WEEKDAYS];
}

export function normalizeTimeOfDay(value: unknown): TimeOfDay | undefined {
  return typeof value === 'string' && TIME_OF_DAY_SET.has(value)
    ? (value as TimeOfDay)
    : undefined;
}

function normalizeDurationMinutes(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

export function isHabitScheduledOnDate(
  habit: Pick<Habit, 'repeatDays'>,
  date = new Date(),
): boolean {
  return habit.repeatDays.includes(WEEKDAYS[date.getDay()]);
}

export function getDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidReminderTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  return Number(match[1]) < 24 && Number(match[2]) < 60;
}

export function isHabitComplete(habit: Habit, date = new Date()): boolean {
  return habit.completedDates.includes(getDateKey(date));
}

export function toggleHabitCompletionOnDate(
  habit: Habit,
  date = new Date(),
): Habit {
  const dateKey = getDateKey(date);
  const completed = isHabitComplete(habit, date);
  const completedDates = completed
    ? habit.completedDates.filter(value => value !== dateKey)
    : habit.completedDates.includes(dateKey)
    ? habit.completedDates
    : [...habit.completedDates, dateKey];

  return {
    ...habit,
    completed: completedDates.includes(getDateKey()),
    completedDates,
  };
}

export function getHabitStreak(habit: Habit, from = new Date()): number {
  let streak = 0;
  const cursor = new Date(from);

  while (isHabitComplete(habit, cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export const initialHabits: Habit[] = [
  {
    id: 1,
    name: 'Morning pages',
    detail: '10 minutes',
    completed: true,
    color: '#E67E55',
    completedDates: [getDateKey()],
    repeatDays: [...WEEKDAYS],
  },
  {
    id: 2,
    name: 'Move your body',
    detail: '30 minutes',
    completed: false,
    color: '#4B8F8C',
    completedDates: [],
    repeatDays: [...WEEKDAYS],
  },
  {
    id: 3,
    name: 'Read something',
    detail: '20 pages',
    completed: false,
    color: '#D9A441',
    completedDates: [],
    repeatDays: [...WEEKDAYS],
  },
  {
    id: 4,
    name: 'Wind down',
    detail: 'Before 10:30 PM',
    completed: false,
    color: '#7A6FA8',
    completedDates: [],
    repeatDays: [...WEEKDAYS],
  },
];

const HABITS_STORAGE_KEY = '@habitmeister/habits';
const ONBOARDING_STORAGE_KEY = '@habitmeister/onboarding-completed';
const REMINDERS_ENABLED_STORAGE_KEY = '@habitmeister/reminders-enabled';
const THEME_MODE_STORAGE_KEY = '@habitmeister/theme-mode';
const ACTION_COLOR_STORAGE_KEY = '@habitmeister/action-color';

export type ThemeMode = 'light' | 'dark';

export const ACTION_COLORS = [
  '#286B69',
  '#2F6FED',
  '#9B59B6',
  '#C65D3A',
  '#B27A00',
] as const;
export type ActionColor = (typeof ACTION_COLORS)[number];

function normalizeHabit(value: unknown): Habit | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== 'number' ||
    !Number.isFinite(record.id) ||
    typeof record.name !== 'string' ||
    !record.name.trim()
  ) {
    return null;
  }

  const storedDates = Array.isArray(record.completedDates)
    ? record.completedDates.filter(
        (date): date is string => typeof date === 'string',
      )
    : [];
  const completedDates =
    storedDates.length > 0 || record.completed !== true
      ? storedDates
      : [getDateKey()];

  return {
    id: record.id,
    name: record.name.trim(),
    detail:
      typeof record.detail === 'string' && record.detail.trim()
        ? record.detail.trim()
        : 'Daily',
    completed: completedDates.includes(getDateKey()),
    color: typeof record.color === 'string' ? record.color : '#286B69',
    timeOfDay: normalizeTimeOfDay(record.timeOfDay),
    location:
      typeof record.location === 'string' && record.location.trim()
        ? record.location.trim()
        : undefined,
    durationMinutes: normalizeDurationMinutes(record.durationMinutes),
    presetId:
      typeof record.presetId === 'string' && record.presetId.trim()
        ? record.presetId.trim()
        : undefined,
    completedDates,
    repeatDays: normalizeRepeatDays(record.repeatDays),
    reminderTime:
      typeof record.reminderTime === 'string' &&
      isValidReminderTime(record.reminderTime)
        ? record.reminderTime
        : undefined,
  };
}

export async function loadOnboardingCompleted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

export async function loadRemindersEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(REMINDERS_ENABLED_STORAGE_KEY);
    return value === null ? true : value === 'true';
  } catch {
    return true;
  }
}

export async function saveRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_ENABLED_STORAGE_KEY, String(enabled));
}

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const value = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
    return value === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
}

export async function loadActionColor(): Promise<ActionColor> {
  try {
    const value = await AsyncStorage.getItem(ACTION_COLOR_STORAGE_KEY);
    return ACTION_COLORS.includes(value as ActionColor)
      ? (value as ActionColor)
      : ACTION_COLORS[0];
  } catch {
    return ACTION_COLORS[0];
  }
}

export async function saveActionColor(color: ActionColor): Promise<void> {
  await AsyncStorage.setItem(ACTION_COLOR_STORAGE_KEY, color);
}

export async function loadHabits(): Promise<Habit[]> {
  try {
    const storedHabits = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
    if (!storedHabits) {
      return initialHabits;
    }

    const parsedHabits: unknown = JSON.parse(storedHabits);
    if (!Array.isArray(parsedHabits)) {
      return initialHabits;
    }

    return parsedHabits
      .map(normalizeHabit)
      .filter((habit): habit is Habit => habit !== null);
  } catch {
    return initialHabits;
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch {}
}

export async function clearLocalHabitData(): Promise<void> {
  await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify([]));
  await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
  await AsyncStorage.removeItem(REMINDERS_ENABLED_STORAGE_KEY);
  await AsyncStorage.removeItem(THEME_MODE_STORAGE_KEY);
  await AsyncStorage.removeItem(ACTION_COLOR_STORAGE_KEY);
}
