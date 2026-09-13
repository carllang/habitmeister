import React from 'react';
import {Pressable, Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {describe, it, expect, jest} from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  },
}));

import {Habit, WEEKDAYS} from '../src/data/habitRepository';
import {HabitList} from '../src/components/TodayHabitList';

describe('HabitList Component', () => {
  const incompleteHabit: Habit = {
    id: 1,
    name: 'Morning pages',
    detail: '10 minutes',
    completed: false,
    color: '#E67E55',
    completedDates: [],
    repeatDays: [...WEEKDAYS],
  };

  const completedHabit: Habit = {
    id: 2,
    name: 'Move your body',
    detail: '30 minutes',
    completed: true,
    color: '#4B8F8C',
    completedDates: ['2026-09-13'],
    repeatDays: [...WEEKDAYS],
  };

  it('renders checkmark ✓ for completed habits and ring outline for incomplete habits', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <HabitList
          actionColor="#286B69"
          habits={[incompleteHabit, completedHabit]}
          isDarkTheme={false}
          onAddHabit={jest.fn()}
          onMoreActions={jest.fn()}
          onToggleHabitOnDate={jest.fn()}
          selectedDate={new Date(2026, 8, 13)}
        />,
      );
    });

    const texts = tree!.root.findAllByType(Text);
    const tickTexts = texts.filter(t => t.props.children === '✓');
    expect(tickTexts).toHaveLength(1);

    tree!.unmount();
  });

  it('triggers onToggleHabitOnDate when tapped', () => {
    const onToggleHabitOnDate = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <HabitList
          actionColor="#286B69"
          habits={[incompleteHabit]}
          isDarkTheme={false}
          onAddHabit={jest.fn()}
          onMoreActions={jest.fn()}
          onToggleHabitOnDate={onToggleHabitOnDate}
          selectedDate={new Date(2026, 8, 13)}
        />,
      );
    });

    const targetPressable = tree!.root.find(
      node =>
        node.type === Pressable &&
        node.props.accessibilityLabel === 'Morning pages, not completed',
    );

    act(() => {
      targetPressable.props.onPress();
    });

    expect(onToggleHabitOnDate).toHaveBeenCalledWith(
      incompleteHabit,
      new Date(2026, 8, 13),
    );

    tree!.unmount();
  });

  it('triggers onToggleHabitOnDate when hold/long press completes', () => {
    const onToggleHabitOnDate = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <HabitList
          actionColor="#286B69"
          habits={[incompleteHabit]}
          isDarkTheme={false}
          onAddHabit={jest.fn()}
          onMoreActions={jest.fn()}
          onToggleHabitOnDate={onToggleHabitOnDate}
          selectedDate={new Date(2026, 8, 13)}
        />,
      );
    });

    const targetPressable = tree!.root.find(
      node =>
        node.type === Pressable &&
        node.props.accessibilityLabel === 'Morning pages, not completed',
    );

    act(() => {
      targetPressable.props.onLongPress();
    });

    expect(onToggleHabitOnDate).toHaveBeenCalledWith(
      incompleteHabit,
      new Date(2026, 8, 13),
    );

    tree!.unmount();
  });
});
