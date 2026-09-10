import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

type HabitActionsModalProps = {
  actionColor: string;
  habitName: string;
  isDarkTheme: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  visible: boolean;
};

export function HabitActionsModal({
  actionColor,
  habitName,
  isDarkTheme,
  onClose,
  onDelete,
  onEdit,
  visible,
}: HabitActionsModalProps): React.JSX.Element {
  const backgroundColor = isDarkTheme ? '#111414' : '#F7F3EC';
  const titleColor = isDarkTheme ? '#F5F7F6' : '#202A2A';
  const mutedColor = isDarkTheme ? '#B7C1BE' : '#778080';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <View style={[styles.card, {backgroundColor}]}>
          <Text style={[styles.title, {color: titleColor}]}>{habitName}</Text>
          <Text style={[styles.subtitle, {color: mutedColor}]}>
            Choose an action
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            style={({pressed}) => [
              styles.actionButton,
              {backgroundColor: actionColor},
              pressed && styles.pressed,
            ]}>
            <Text style={styles.actionButtonText}>Edit habit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            style={({pressed}) => [
              styles.actionButton,
              styles.deleteButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.deleteButtonText}>Delete habit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.cancelButton}>
            <Text style={[styles.cancelText, {color: mutedColor}]}>Cancel</Text>
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
  subtitle: {fontSize: 13, marginTop: 6},
  actionButton: {
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
    paddingVertical: 13,
  },
  actionButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
  deleteButton: {backgroundColor: '#A34B45', marginTop: 10},
  deleteButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
  cancelButton: {alignItems: 'center', marginTop: 12, paddingVertical: 10},
  cancelText: {fontSize: 13, fontWeight: '700'},
  pressed: {opacity: 0.72},
});
