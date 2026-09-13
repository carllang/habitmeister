import React, {useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getDateKey,
  getHabitStreak,
  Habit,
  isHabitComplete,
} from '../data/habitRepository';
import {CircularHoldProgress} from './CircularHoldProgress';

type HabitListProps = {
  actionColor: string;
  habits: Habit[];
  isDarkTheme: boolean;
  onAddHabit: () => void;
  onMoreActions: (habit: Habit) => void;
  onToggleHabitOnDate: (habit: Habit, date: Date) => void;
  selectedDate: Date;
};

type HabitRowItemProps = {
  actionColor: string;
  habit: Habit;
  isDarkTheme: boolean;
  isFutureDate: boolean;
  onMoreActions: (habit: Habit) => void;
  onToggleHabitOnDate: (habit: Habit, date: Date) => void;
  selectedDate: Date;
};

function HabitRowItem({
  actionColor,
  habit,
  isDarkTheme,
  isFutureDate,
  onMoreActions,
  onToggleHabitOnDate,
  selectedDate,
}: HabitRowItemProps): React.JSX.Element {
  const completed = isHabitComplete(habit, selectedDate);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const hasToggledRef = useRef(false);

  const handlePressIn = () => {
    if (isFutureDate) {
      return;
    }
    hasToggledRef.current = false;
    holdProgress.setValue(0);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished && !hasToggledRef.current) {
        hasToggledRef.current = true;
        onToggleHabitOnDate(habit, selectedDate);
        Animated.timing(holdProgress, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const handlePressOut = () => {
    if (!hasToggledRef.current) {
      Animated.timing(holdProgress, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLongPress = () => {
    if (!hasToggledRef.current && !isFutureDate) {
      hasToggledRef.current = true;
      onToggleHabitOnDate(habit, selectedDate);
      Animated.timing(holdProgress, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (!hasToggledRef.current && !isFutureDate) {
      hasToggledRef.current = true;
      holdProgress.setValue(0);
      onToggleHabitOnDate(habit, selectedDate);
    }
  };

  return (
    <View style={styles.habitRow}>
      <Pressable
        accessibilityHint="Tap or hold down to toggle completion"
        accessibilityLabel={`${habit.name}, ${
          completed ? 'completed' : 'not completed'
        }`}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: completed,
          disabled: isFutureDate,
        }}
        disabled={isFutureDate}
        onLongPress={handleLongPress}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        pressRetentionOffset={{top: 20, bottom: 20, left: 20, right: 20}}
        style={({pressed}) => [
          styles.habitTapTarget,
          pressed && styles.habitRowPressed,
        ]}>
        <CircularHoldProgress
          completed={completed}
          fillColor={habit.color}
          holdProgress={holdProgress}
          isDarkTheme={isDarkTheme}
          showCheckmark={true}
          size={34}
          strokeWidth={2.5}
        />
        <View style={styles.habitCopy}>
          <Text style={[styles.habitName, isDarkTheme && styles.darkText]}>
            {habit.name}
          </Text>
          <Text
            style={[styles.habitDetail, isDarkTheme && styles.darkMutedText]}>
            {habit.detail}
            {habit.durationMinutes ? `  ·  ${habit.durationMinutes} min` : ''}
            {habit.location ? `  ·  ${habit.location}` : ''}
          </Text>
          <Text
            style={[styles.habitSchedule, isDarkTheme && styles.darkMutedText]}>
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
}

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
        {habits.map(habit => (
          <HabitRowItem
            actionColor={actionColor}
            habit={habit}
            isDarkTheme={isDarkTheme}
            isFutureDate={isFutureDate}
            key={habit.id}
            onMoreActions={onMoreActions}
            onToggleHabitOnDate={onToggleHabitOnDate}
            selectedDate={selectedDate}
          />
        ))}
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
  habitList: {borderTopColor: '#E5DED3', borderTopWidth: 1, marginTop: 0},
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
  habitCopy: {flex: 1, marginLeft: 14},
  habitName: {color: '#202A2A', fontSize: 16, fontWeight: '600'},
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
