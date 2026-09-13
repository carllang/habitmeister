import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

type FreePlanLimitModalProps = {
  actionColor: string;
  ctaLabel?: string;
  isDarkTheme: boolean;
  message?: string;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  visible: boolean;
};

export function FreePlanLimitModal({
  actionColor,
  ctaLabel = 'View Premium',
  isDarkTheme,
  message = 'Upgrade to add more than 5 active habits.',
  onClose,
  onUpgrade,
  title = 'Free plan limit',
  visible,
}: FreePlanLimitModalProps): React.JSX.Element {
  const backgroundColor = isDarkTheme ? '#111414' : '#F7F3EC';
  const titleColor = isDarkTheme ? '#F5F7F6' : '#202A2A';
  const mutedColor = isDarkTheme ? '#B7C1BE' : '#778080';
  const buttonTextColor =
    actionColor === '#B27A00' || actionColor === '#D98A00'
      ? '#202A2A'
      : '#FFFFFF';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <View style={[styles.card, {backgroundColor}]}>
          <Text style={[styles.title, {color: titleColor}]}>{title}</Text>
          <Text style={[styles.message, {color: mutedColor}]}>{message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onUpgrade}
            style={({pressed}) => [
              styles.upgradeButton,
              {backgroundColor: actionColor},
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.upgradeText, {color: buttonTextColor}]}>
              {ctaLabel}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.cancelButton}>
            <Text style={[styles.cancelText, {color: actionColor}]}>
              Not now
            </Text>
          </Pressable>
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
  title: {fontSize: 20, fontWeight: '700'},
  message: {fontSize: 14, lineHeight: 21, marginTop: 8},
  upgradeButton: {
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 22,
    paddingVertical: 13,
  },
  upgradeText: {fontSize: 14, fontWeight: '700'},
  cancelButton: {alignItems: 'center', marginTop: 10, paddingVertical: 12},
  cancelText: {fontSize: 14, fontWeight: '700'},
  pressed: {opacity: 0.72},
});
