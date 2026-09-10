import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

type DeleteLocalDataModalProps = {
  actionColor: string;
  isDarkTheme: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function DeleteLocalDataModal({
  actionColor,
  isDarkTheme,
  onCancel,
  onConfirm,
  visible,
}: DeleteLocalDataModalProps): React.JSX.Element {
  const backgroundColor = isDarkTheme ? '#111414' : '#F7F3EC';
  const titleColor = isDarkTheme ? '#F5F7F6' : '#202A2A';
  const mutedColor = isDarkTheme ? '#B7C1BE' : '#778080';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <View style={[styles.card, {backgroundColor}]}>
          <Text style={[styles.title, {color: titleColor}]}>
            Delete local data?
          </Text>
          <Text style={[styles.message, {color: mutedColor}]}>
            This removes all habits and completion history from this device and
            returns you to onboarding.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={({pressed}) => [
              styles.deleteButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.deleteText}>Delete everything</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({pressed}) => [
              styles.cancelButton,
              {borderColor: actionColor},
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.cancelText, {color: actionColor}]}>
              Cancel
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
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#A34B45',
    borderRadius: 5,
    marginTop: 22,
    paddingVertical: 13,
  },
  deleteText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
  cancelButton: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 10,
    paddingVertical: 12,
  },
  cancelText: {fontSize: 14, fontWeight: '700'},
  pressed: {opacity: 0.72},
});
