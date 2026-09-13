import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

export type CircularHoldProgressProps = {
  completed: boolean;
  fillColor: string;
  holdProgress: Animated.Value;
  isDarkTheme?: boolean;
  showCheckmark?: boolean;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
};

export function CircularHoldProgress({
  completed,
  fillColor,
  holdProgress,
  isDarkTheme = false,
  showCheckmark = true,
  size = 34,
  strokeWidth = 3,
  trackColor,
}: CircularHoldProgressProps): React.JSX.Element {
  const checkScale = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const checkOpacity = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const popScale = useRef(new Animated.Value(1)).current;
  const prevCompletedRef = useRef(completed);

  const defaultTrackColor =
    trackColor ??
    (isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)');

  useEffect(() => {
    if (completed && !prevCompletedRef.current) {
      // Completed pop & checkmark spring animation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(popScale, {
            toValue: 1.18,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(popScale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!completed && prevCompletedRef.current) {
      // Reset when uncompleted
      popScale.setValue(1);
      checkScale.setValue(0);
      checkOpacity.setValue(0);
    } else if (completed) {
      checkScale.setValue(1);
      checkOpacity.setValue(1);
    } else {
      checkScale.setValue(0);
      checkOpacity.setValue(0);
    }
    prevCompletedRef.current = completed;
  }, [completed, checkOpacity, checkScale, popScale]);

  const radius = size / 2;
  const halfSize = radius;

  // Right half fills first (0% to 50% / 0deg to 180deg)
  const rightRotate = holdProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '0deg', '0deg'],
    extrapolate: 'clamp',
  });

  // Left half fills second (50% to 100% / 180deg to 360deg)
  const leftRotate = holdProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '-180deg', '0deg'],
    extrapolate: 'clamp',
  });

  const fontSize = Math.max(13, Math.round(size * 0.44));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.outerContainer,
        {
          borderRadius: radius,
          height: size,
          width: size,
          transform: [{scale: popScale}],
        },
        completed && {
          backgroundColor: fillColor,
        },
      ]}>
      {!completed && (
        <>
          {/* Static track circle */}
          <View
            pointerEvents="none"
            style={[
              styles.trackRing,
              {
                borderColor: defaultTrackColor,
                borderRadius: radius,
                borderWidth: strokeWidth,
                height: size,
                width: size,
              },
            ]}
          />

          {/* Right semi-circle mask (0 to 180 deg) */}
          <View
            pointerEvents="none"
            style={[
              styles.halfContainer,
              styles.rightPosition,
              {
                height: size,
                width: halfSize,
              },
            ]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.rotator,
                styles.rightPosition,
                {
                  height: size,
                  transform: [{rotate: rightRotate}],
                  width: size,
                },
              ]}>
              <View
                pointerEvents="none"
                style={[
                  styles.arcMask,
                  styles.rightPosition,
                  {
                    height: size,
                    width: halfSize,
                  },
                ]}>
                <View
                  pointerEvents="none"
                  style={[
                    styles.coloredRing,
                    styles.rightPosition,
                    {
                      borderColor: fillColor,
                      borderRadius: radius,
                      borderWidth: strokeWidth,
                      height: size,
                      width: size,
                    },
                  ]}
                />
              </View>
            </Animated.View>
          </View>

          {/* Left semi-circle mask (180 to 360 deg) */}
          <View
            pointerEvents="none"
            style={[
              styles.halfContainer,
              styles.leftPosition,
              {
                height: size,
                width: halfSize,
              },
            ]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.rotator,
                styles.leftPosition,
                {
                  height: size,
                  transform: [{rotate: leftRotate}],
                  width: size,
                },
              ]}>
              <View
                pointerEvents="none"
                style={[
                  styles.arcMask,
                  styles.leftPosition,
                  {
                    height: size,
                    width: halfSize,
                  },
                ]}>
                <View
                  pointerEvents="none"
                  style={[
                    styles.coloredRing,
                    styles.leftPosition,
                    {
                      borderColor: fillColor,
                      borderRadius: radius,
                      borderWidth: strokeWidth,
                      height: size,
                      width: size,
                    },
                  ]}
                />
              </View>
            </Animated.View>
          </View>
        </>
      )}

      {/* Unfill overlay when completed habit is pressed */}
      {completed && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.unfillOverlay,
            {
              borderRadius: radius,
              opacity: holdProgress,
            },
          ]}
        />
      )}

      {/* Checkmark revealed when complete */}
      {completed && showCheckmark && (
        <Animated.Text
          style={[
            styles.checkMark,
            {
              fontSize,
              lineHeight: fontSize + 3,
              opacity: checkOpacity,
              transform: [{scale: checkScale}],
            },
          ]}>
          ✓
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  trackRing: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  halfContainer: {
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  rotator: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  arcMask: {
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  coloredRing: {
    position: 'absolute',
    top: 0,
  },
  leftPosition: {
    left: 0,
  },
  rightPosition: {
    right: 0,
  },
  unfillOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  checkMark: {
    color: '#FFFFFF',
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
