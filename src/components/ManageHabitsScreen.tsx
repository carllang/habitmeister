import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {Habit} from '../data/habitRepository';
import {HabitActionsModal} from './HabitActionsModal';

type ManageHabitsScreenProps = {
  actionColor: string;
  habits: Habit[];
  isDarkTheme: boolean;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onRemoveHabit: (habit: Habit) => void;
};

export function ManageHabitsScreen({
  actionColor,
  habits,
  isDarkTheme,
  onAddHabit,
  onEditHabit,
  onRemoveHabit,
}: ManageHabitsScreenProps): React.JSX.Element {
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const closeActions = () => setSelectedHabit(null);

  const editSelectedHabit = () => {
    if (selectedHabit) {
      onEditHabit(selectedHabit);
      closeActions();
    }
  };

  const deleteSelectedHabit = () => {
    if (selectedHabit) {
      onRemoveHabit(selectedHabit);
      closeActions();
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.label, {color: actionColor}]}>YOUR ROUTINE</Text>
          <Text style={[styles.title, isDarkTheme && styles.darkText]}>
            Manage habits
          </Text>
        </View>
        <Text style={styles.count}>{habits.length} active</Text>
      </View>
      <Text style={styles.description}>
        Shape the habits you want to keep close.
      </Text>
      <View style={styles.list}>
        {habits.map(habit => (
          <View key={habit.id} style={styles.row}>
            <View style={[styles.colorMark, {backgroundColor: habit.color}]} />
            <View style={styles.copy}>
              <Text style={[styles.name, isDarkTheme && styles.darkText]}>
                {habit.name}
              </Text>
              <Text
                style={[styles.detail, isDarkTheme && styles.darkMutedText]}>
                {habit.detail}
                {habit.timeOfDay ? `  ·  ${habit.timeOfDay}` : ''}
                {habit.durationMinutes
                  ? `  ·  ${habit.durationMinutes} min`
                  : ''}
              </Text>
              {habit.location ? (
                <Text
                  style={[
                    styles.location,
                    {color: actionColor},
                    isDarkTheme && styles.darkAccentText,
                  ]}>
                  {habit.location}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel={`Actions for ${habit.name}`}
              accessibilityRole="button"
              onPress={() => setSelectedHabit(habit)}
              style={styles.menuButton}>
              <Text style={[styles.menuIcon, {color: actionColor}]}>⋮</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAddHabit}
        style={({pressed}) => [
          styles.addButton,
          {borderColor: actionColor},
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.addButtonText, {color: actionColor}]}>
          + Add a habit
        </Text>
      </Pressable>
      <HabitActionsModal
        actionColor={actionColor}
        habitName={selectedHabit?.name ?? ''}
        isDarkTheme={isDarkTheme}
        onClose={closeActions}
        onDelete={deleteSelectedHabit}
        onEdit={editSelectedHabit}
        visible={selectedHabit !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  headerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#286B69',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    color: '#202A2A',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 7,
  },
  count: {color: '#778080', fontSize: 12, marginBottom: 4},
  description: {
    color: '#778080',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
    marginTop: 16,
  },
  list: {borderTopColor: '#E5DED3', borderTopWidth: 1},
  row: {
    alignItems: 'center',
    borderBottomColor: '#E5DED3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 82,
    paddingVertical: 14,
  },
  colorMark: {borderRadius: 6, height: 12, width: 12},
  copy: {flex: 1, marginLeft: 14},
  name: {color: '#202A2A', fontSize: 16, fontWeight: '600'},
  detail: {color: '#778080', fontSize: 12, marginTop: 5},
  location: {color: '#286B69', fontSize: 11, marginTop: 3},
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuIcon: {fontSize: 20, fontWeight: '700'},
  addButton: {
    alignItems: 'center',
    borderColor: '#286B69',
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 24,
    paddingVertical: 13,
  },
  addButtonText: {color: '#286B69', fontSize: 14, fontWeight: '700'},
  pressed: {opacity: 0.7},
  darkText: {color: '#F5F7F6'},
  darkMutedText: {color: '#B7C1BE'},
  darkAccentText: {color: '#72D6C1'},
});
