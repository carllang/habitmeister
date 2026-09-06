import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

import {
  Habit,
  isValidReminderTime,
  WEEKDAYS,
  Weekday,
} from '../data/habitRepository';

export const REMINDER_CHANNEL_ID = 'habitmeister-reminders';

export type ReminderTime = {
  hours: number;
  minutes: number;
};

export function parseReminderTime(value: string): ReminderTime | null {
  if (!isValidReminderTime(value)) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return {hours, minutes};
}

export function getReminderNotificationId(
  habitId: number,
  weekday?: Weekday,
): string {
  return `habitmeister-reminder-${habitId}${weekday ? `-${weekday}` : ''}`;
}

export function getNextReminderDate(
  reminderTime: ReminderTime,
  now = new Date(),
  repeatDays: Weekday[] = [...WEEKDAYS],
): Date {
  const days = repeatDays.length > 0 ? repeatDays : [...WEEKDAYS];
  for (let offset = 0; offset <= 7; offset += 1) {
    const reminderDate = new Date(now);
    reminderDate.setDate(now.getDate() + offset);
    reminderDate.setHours(reminderTime.hours, reminderTime.minutes, 0, 0);
    const isToday = offset === 0;
    const isSelected = days.includes(WEEKDAYS[reminderDate.getDay()]);
    if (isSelected && (!isToday || reminderDate.getTime() > now.getTime())) {
      return reminderDate;
    }
  }

  return new Date(now);
}

async function ensureReminderChannel(): Promise<void> {
  await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Habit reminders',
    lights: false,
    vibration: true,
    importance: AndroidImportance.HIGH,
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function initialiseReminderNotifications(): Promise<boolean> {
  try {
    await ensureReminderChannel();
    return requestReminderPermission();
  } catch {
    return false;
  }
}

export async function cancelReminder(habitId: number): Promise<void> {
  try {
    await Promise.all([
      notifee.cancelTriggerNotification(getReminderNotificationId(habitId)),
      ...WEEKDAYS.map(day =>
        notifee.cancelTriggerNotification(
          getReminderNotificationId(habitId, day),
        ),
      ),
    ]);
  } catch {}
}

export async function scheduleReminder(
  habit: Pick<Habit, 'id' | 'name' | 'reminderTime'> & {
    repeatDays?: Weekday[];
  },
  now = new Date(),
): Promise<boolean> {
  if (!habit.reminderTime) {
    await cancelReminder(habit.id);
    return false;
  }

  const reminderTime = parseReminderTime(habit.reminderTime);
  if (!reminderTime) {
    await cancelReminder(habit.id);
    return false;
  }

  try {
    await cancelReminder(habit.id);
    await ensureReminderChannel();
    const repeatDays =
      habit.repeatDays && habit.repeatDays.length > 0
        ? habit.repeatDays
        : [...WEEKDAYS];
    const daysToSchedule =
      repeatDays.length === WEEKDAYS.length ? [undefined] : repeatDays;
    await Promise.all(
      daysToSchedule.map(day => {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: getNextReminderDate(
            reminderTime,
            now,
            day ? [day] : repeatDays,
          ).getTime(),
          repeatFrequency: day ? RepeatFrequency.WEEKLY : RepeatFrequency.DAILY,
        };
        return notifee.createTriggerNotification(
          {
            id: getReminderNotificationId(habit.id, day),
            title: 'Time for your habit',
            body: habit.name,
            android: {
              channelId: REMINDER_CHANNEL_ID,
              pressAction: {id: 'default'},
            },
          },
          trigger,
        );
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function rescheduleReminders(
  habits: Array<
    Pick<Habit, 'id' | 'name' | 'reminderTime'> & {repeatDays?: Weekday[]}
  >,
  now = new Date(),
): Promise<void> {
  await Promise.all(habits.map(habit => scheduleReminder(habit, now)));
}
