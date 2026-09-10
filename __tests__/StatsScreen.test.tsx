import React from 'react';
import {Pressable} from 'react-native';
import renderer from 'react-test-renderer';
import {it, expect, jest} from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  },
}));

import {Habit, WEEKDAYS} from '../src/data/habitRepository';
import {StatsScreen} from '../src/components/StatsScreen';

it('opens a habit detail callback when a stats row is pressed', () => {
  const habit: Habit = {
    id: 1,
    name: 'Read',
    detail: '20 pages',
    completed: false,
    color: '#286B69',
    completedDates: [],
    repeatDays: [...WEEKDAYS],
  };
  const onHabitPress = jest.fn();
  const tree = renderer.create(
    <StatsScreen
      actionColor="#286B69"
      habits={[habit]}
      isDarkTheme={false}
      onHabitPress={onHabitPress}
      today={new Date(2026, 8, 8)}
    />,
  );

  const habitRow = tree.root.find(
    node =>
      node.type === Pressable &&
      node.props.accessibilityLabel === 'View statistics for Read',
  );
  habitRow.props.onPress();

  expect(onHabitPress).toHaveBeenCalledWith(habit);
  tree.unmount();
});
