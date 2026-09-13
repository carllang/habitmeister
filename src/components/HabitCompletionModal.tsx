import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {Habit} from '../data/habitRepository';
import {CircularHoldProgress} from './CircularHoldProgress';

const HOLD_DURATION_MS = 1000;

type HabitCompletionModalProps = {
  actionColor: string;
  habit: Habit | null;
  isDarkTheme: boolean;
  isFutureDate: boolean;
  isComplete: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export function HabitCompletionModal({
  actionColor,
  habit,
  isDarkTheme,
  isFutureDate,
  isComplete,
  onClose,
  onComplete,
}: HabitCompletionModalProps): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
  }, [habit, isComplete, progress]);

  const startHold = () => {
    if (isFutureDate || isComplete) {
      return;
    }

    Animated.timing(progress, {
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        onComplete();
        onClose();
      }
    });
  };

  const cancelHold = () => {
    if (!isComplete) {
      progress.stopAnimation();
      Animated.timing(progress, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const backgroundColor = isDarkTheme ? '#111414' : '#F7F3EC';
  const innerCenterBg = isDarkTheme ? '#192221' : '#EDE8DC';
  const titleColor = isDarkTheme ? '#F5F7F6' : '#202A2A';
  const mutedColor = isDarkTheme ? '#B7C1BE' : '#778080';
  const trackColor = isDarkTheme ? '#35403E' : '#D8D5C9';
  const buttonLabel = isFutureDate
    ? 'Future dates cannot be completed'
    : isComplete
    ? '✓ Completed'
    : 'Hold to complete';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={habit !== null}>
      <View style={styles.backdrop}>
        <View style={[styles.card, {backgroundColor}]}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: titleColor}]}>
              Habit details
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[styles.closeText, {color: actionColor}]}>
                Close
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.habitName, {color: titleColor}]}>
            {habit?.name}
          </Text>
          <Text style={[styles.habitDetail, {color: mutedColor}]}>
            {habit?.detail}
          </Text>
          <View style={styles.metadata}>
            {habit?.durationMinutes ? (
              <Text style={[styles.metadataText, {color: mutedColor}]}>
                {habit.durationMinutes} minutes
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={buttonLabel}
            accessibilityRole="button"
            accessibilityState={{disabled: isFutureDate || isComplete}}
            disabled={isFutureDate || isComplete}
            onPressIn={startHold}
            onPressOut={cancelHold}
            style={styles.holdArea}>
            <View style={styles.ringWrapper}>
              <CircularHoldProgress
                completed={isComplete}
                fillColor={habit?.color || actionColor}
                holdProgress={progress}
                isDarkTheme={isDarkTheme}
                showCheckmark={false}
                size={144}
                strokeWidth={9}
                trackColor={trackColor}
              />
              <View
                style={[styles.ringCenter, {backgroundColor: innerCenterBg}]}>
                <Text style={[styles.ringText, {color: titleColor}]}>
                  {buttonLabel}
                </Text>
              </View>
            </View>
          </Pressable>
          {!isComplete && !isFutureDate ? (
            <Text style={[styles.holdHint, {color: mutedColor}]}>
              Press and hold for one second
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {borderRadius: 10, padding: 22, width: '100%'},
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {fontSize: 17, fontWeight: '700'},
  closeText: {fontSize: 13, fontWeight: '700'},
  habitName: {fontSize: 24, fontWeight: '700', marginTop: 28},
  habitDetail: {fontSize: 14, marginTop: 8},
  metadata: {flexDirection: 'row', gap: 14, marginTop: 12},
  metadataText: {fontSize: 12},
  holdArea: {alignItems: 'center', marginTop: 34},
  ringWrapper: {
    alignItems: 'center',
    height: 144,
    justifyContent: 'center',
    position: 'relative',
    width: 144,
  },
  ringCenter: {
    alignItems: 'center',
    borderRadius: 58,
    height: 116,
    justifyContent: 'center',
    paddingHorizontal: 12,
    position: 'absolute',
    width: 116,
  },
  ringText: {fontSize: 14, fontWeight: '700', textAlign: 'center'},
  holdHint: {fontSize: 12, marginTop: 14, textAlign: 'center'},
});
