import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {
  getDateKey,
  getHabitStreak,
  Habit,
  isHabitComplete,
} from '../data/habitRepository';

type HabitListProps = {
  actionColor: string;
  habits: Habit[];
  isDarkTheme: boolean;
  onAddHabit: () => void;
  onMoreActions: (habit: Habit) => void;
  onToggleHabitOnDate: (habit: Habit, date: Date) => void;
  selectedDate: Date;
};

export function HabitList({
  actionColor,
  habits,
  isDarkTheme,
  onAddHabit,
  onMoreActions,
  onToggleHabitOnDate,
  selectedDate,
}: HabitListProps): React.JSX.Element {
  const isFutureDate = getDateKey(selectedDate) > getDateKey(new Date());

  return (
    <>
      <View style={styles.habitList}>
        {habits.map(habit => {
          const completed = isHabitComplete(habit, selectedDate);
          return (
            <View key={habit.id} style={styles.habitRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: completed,
                  disabled: isFutureDate,
                }}
                disabled={isFutureDate}
                onPress={() => onToggleHabitOnDate(habit, selectedDate)}
                style={({pressed}) => [
                  styles.habitTapTarget,
                  pressed && styles.habitRowPressed,
                ]}>
                <View
                  style={[styles.habitMarker, {backgroundColor: habit.color}]}>
                  {completed && <Text style={styles.markerText}>OK</Text>}
                </View>
                <View style={styles.habitCopy}>
                  <Text
                    style={[
                      styles.habitName,
                      isDarkTheme && styles.darkText,
                      completed && styles.completedText,
                    ]}>
                    {habit.name}
                  </Text>
                  <Text
                    style={[
                      styles.habitDetail,
                      isDarkTheme && styles.darkMutedText,
                    ]}>
                    {habit.detail}
                    {habit.reminderTime ? `  ·  ${habit.reminderTime}` : ''}
                    {habit.durationMinutes
                      ? `  ·  ${habit.durationMinutes} min`
                      : ''}
                    {habit.location ? `  ·  ${habit.location}` : ''}
                  </Text>
                  <Text
                    style={[
                      styles.habitSchedule,
                      isDarkTheme && styles.darkMutedText,
                    ]}>
                    {habit.timeOfDay ? `${habit.timeOfDay}  ·  ` : ''}
                    {habit.repeatDays.join(', ')}
                  </Text>
                </View>
                <Text style={[styles.streak, {color: actionColor}]}>
                  {getHabitStreak(habit, selectedDate)} day streak
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`More actions for ${habit.name}`}
                onPress={() => onMoreActions(habit)}
                style={styles.moreButton}>
                <Text style={styles.moreText}>...</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAddHabit}
        style={({pressed}) => [
          styles.addButton,
          {borderColor: actionColor},
          pressed && styles.buttonPressed,
        ]}>
        <Text style={[styles.addButtonText, {color: actionColor}]}>
          + Add a habit
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  habitList: {borderTopColor: '#E5DED3', borderTopWidth: 1, marginTop: 28},
  habitRow: {
    alignItems: 'center',
    borderBottomColor: '#E5DED3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingVertical: 12,
  },
  habitTapTarget: {alignItems: 'center', flex: 1, flexDirection: 'row'},
  habitRowPressed: {opacity: 0.65},
  habitMarker: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  markerText: {color: '#FFFFFF', fontSize: 10, fontWeight: '800'},
  habitCopy: {flex: 1, marginLeft: 14},
  habitName: {color: '#202A2A', fontSize: 16, fontWeight: '600'},
  completedText: {textDecorationLine: 'line-through'},
  habitDetail: {color: '#778080', fontSize: 12, marginTop: 4},
  habitSchedule: {color: '#778080', fontSize: 11, marginTop: 3},
  streak: {color: '#286B69', fontSize: 11, fontWeight: '700'},
  moreButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginLeft: 4,
    width: 30,
  },
  moreText: {
    color: '#778080',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
  },
  addButton: {
    alignItems: 'center',
    borderColor: '#286B69',
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 24,
    paddingVertical: 13,
  },
  addButtonText: {color: '#286B69', fontSize: 14, fontWeight: '700'},
  buttonPressed: {opacity: 0.7},
  darkText: {color: '#F5F7F6'},
  darkMutedText: {color: '#B7C1BE'},
});
