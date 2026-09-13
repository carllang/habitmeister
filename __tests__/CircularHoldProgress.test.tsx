import React from 'react';
import {Animated} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {describe, it, expect} from '@jest/globals';

import {CircularHoldProgress} from '../src/components/CircularHoldProgress';

describe('CircularHoldProgress Component', () => {
  it('renders track ring and masks when not completed', () => {
    const holdProgress = new Animated.Value(0);
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CircularHoldProgress
          completed={false}
          fillColor="#31A39C"
          holdProgress={holdProgress}
          isDarkTheme={false}
          size={34}
        />,
      );
    });

    const json = tree!.toJSON();
    expect(json).toBeTruthy();
    tree!.unmount();
  });

  it('renders checkmark when completed and showCheckmark is true', () => {
    const holdProgress = new Animated.Value(0);
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CircularHoldProgress
          completed={true}
          fillColor="#31A39C"
          holdProgress={holdProgress}
          isDarkTheme={true}
          showCheckmark={true}
          size={34}
        />,
      );
    });

    const textNodes = tree!.root.findAllByType(Animated.Text);
    const checkmarkNode = textNodes.find(t => t.props.children === '✓');
    expect(checkmarkNode).toBeDefined();

    tree!.unmount();
  });

  it('renders without checkmark when showCheckmark is false', () => {
    const holdProgress = new Animated.Value(0);
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CircularHoldProgress
          completed={true}
          fillColor="#31A39C"
          holdProgress={holdProgress}
          isDarkTheme={false}
          showCheckmark={false}
          size={144}
        />,
      );
    });

    const textNodes = tree!.root.findAllByType(Animated.Text);
    expect(textNodes).toHaveLength(0);

    tree!.unmount();
  });
});
