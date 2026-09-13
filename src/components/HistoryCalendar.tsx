import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {getDateKey, Habit, isHabitComplete} from '../data/habitRepository';

type HistoryCalendarProps = {
  actionColor: string;
  habits: Habit[];
  isDarkTheme: boolean;
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
};

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart;
}

function shiftWeek(date: Date, amount: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + amount * 7);
  return shifted;
}

export function HistoryCalendar({
  actionColor,
  habits,
  isDarkTheme,
  selectedDate,
  onChangeDate,
}: HistoryCalendarProps): React.JSX.Element {
  const weekStart = getWeekStart(selectedDate);
  const weekDays = Array.from({length: 7}, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const selectedDateKey = getDateKey(selectedDate);
  const todayKey = getDateKey(new Date());
  const monthLabel = weekStart.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.screen}>
      <View style={styles.navigationRow}>
        <Pressable
          accessibilityLabel="Previous week"
          accessibilityRole="button"
          onPress={() => onChangeDate(shiftWeek(selectedDate, -1))}
          style={styles.navigationButton}>
          <Text style={[styles.navigationText, {color: actionColor}]}>‹</Text>
        </Pressable>
        <View style={styles.navigationLabel}>
          <Text style={[styles.monthLabel, {color: actionColor}]}>
            {monthLabel}
          </Text>
          <Text style={[styles.weekLabel, isDarkTheme && styles.darkMutedText]}>
            Select a day
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Next week"
          accessibilityRole="button"
          onPress={() => onChangeDate(shiftWeek(selectedDate, 1))}
          style={styles.navigationButton}>
          <Text style={[styles.navigationText, {color: actionColor}]}>›</Text>
        </Pressable>
      </View>
      <View style={styles.calendarRow}>
        {weekDays.map(date => {
          const dateKey = getDateKey(date);
          const completedCount = habits.filter(habit =>
            isHabitComplete(habit, date),
          ).length;
          const selected = dateKey === selectedDateKey;
          const isToday = dateKey === todayKey;
          return (
            <Pressable
              accessibilityLabel={`Select ${date.toLocaleDateString()}`}
              accessibilityRole="button"
              key={dateKey}
              onPress={() => onChangeDate(date)}
              style={[
                styles.dayCell,
                selected && {backgroundColor: actionColor},
              ]}>
              <Text
                style={[
                  styles.dayName,
                  isDarkTheme && styles.darkMutedText,
                  selected && styles.selectedText,
                ]}>
                {date.toLocaleDateString(undefined, {weekday: 'short'})}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isDarkTheme && styles.darkText,
                  selected && styles.selectedText,
                ]}>
                {date.getDate()}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  completedCount > 0 && styles.completedDayDot,
                  isToday && styles.todayDayDot,
                  selected && !isToday && styles.selectedDayDot,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {width: '100%'},
  navigationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navigationButton: {paddingHorizontal: 12, paddingVertical: 4},
  navigationText: {color: '#286B69', fontSize: 28, lineHeight: 30},
  navigationLabel: {alignItems: 'center'},
  monthLabel: {fontSize: 14, fontWeight: '700'},
  weekLabel: {color: '#778080', fontSize: 12, fontWeight: '600'},
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: 6,
    minWidth: 38,
    paddingHorizontal: 3,
    paddingVertical: 9,
  },
  selectedDayCell: {backgroundColor: '#286B69'},
  dayName: {color: '#778080', fontSize: 10, fontWeight: '600'},
  dayNumber: {color: '#202A2A', fontSize: 16, fontWeight: '700', marginTop: 6},
  selectedText: {color: '#FFFFFF'},
  dayDot: {
    backgroundColor: '#D8D5C9',
    borderRadius: 3,
    height: 6,
    marginTop: 7,
    width: 6,
  },
  completedDayDot: {backgroundColor: '#D9A441'},
  todayDayDot: {backgroundColor: '#D9A441'},
  selectedDayDot: {backgroundColor: '#FFFFFF'},
  darkText: {color: '#F5F7F6'},
  darkMutedText: {color: '#B7C1BE'},
});
