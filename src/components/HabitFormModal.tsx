import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {TimePickerField} from '../TimePickerField';
import {
  TimeOfDay,
  Weekday,
  WEEKDAYS,
  TIMES_OF_DAY,
} from '../data/habitRepository';

type HabitFormModalProps = {
  actionColor: string;
  themeMode: 'light' | 'dark';
  detail: string;
  duration: string;
  editingHabitId: number | null;
  location: string;
  name: string;
  onChangeColor: (value: string) => void;
  onChangeDetail: (value: string) => void;
  onChangeDuration: (value: string) => void;
  onChangeLocation: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangeReminder: (value: string) => void;
  onChangeTimeOfDay: (value: TimeOfDay | undefined) => void;
  onClose: () => void;
  onSave: () => void;
  onToggleDay: (day: Weekday) => void;
  reminder: string;
  repeatDays: Weekday[];
  selectedColor: string;
  timeOfDay: TimeOfDay | undefined;
  visible: boolean;
};

const PRESETS = [
  {detail: '10 minutes', name: 'Morning pages'},
  {detail: '20 pages', name: 'Read something'},
  {detail: '30 minutes', name: 'Move your body'},
];

const COLORS = ['#286B69', '#E67E55', '#D9A441', '#7A6FA8', '#4B8F8C'];

export function HabitFormModal({
  actionColor,
  themeMode,
  detail,
  duration,
  editingHabitId,
  location,
  name,
  onChangeColor,
  onChangeDetail,
  onChangeDuration,
  onChangeLocation,
  onChangeName,
  onChangeReminder,
  onChangeTimeOfDay,
  onClose,
  onSave,
  onToggleDay,
  reminder,
  repeatDays,
  selectedColor,
  timeOfDay,
  visible,
}: HabitFormModalProps): React.JSX.Element {
  const isDarkTheme = themeMode === 'dark';
  const themeColors = {
    ink: isDarkTheme ? '#F5F7F6' : colors.ink,
    muted: isDarkTheme ? '#B7C1BE' : colors.muted,
    line: isDarkTheme ? '#35403E' : colors.line,
    paper: isDarkTheme ? '#111414' : colors.paper,
    preset: isDarkTheme ? '#1D2423' : '#EDE6DB',
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.modalCard,
            {backgroundColor: themeColors.paper},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, {color: themeColors.ink}]}>
              {editingHabitId === null ? 'New habit' : 'Edit habit'}
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[styles.cancelText, {color: actionColor}]}>
                Cancel
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            QUICK START
          </Text>
          <View style={styles.presetRow}>
            {PRESETS.map(preset => (
              <Pressable
                accessibilityRole="button"
                key={preset.name}
                onPress={() => {
                  onChangeName(preset.name);
                  onChangeDetail(preset.detail);
                }}
                style={[
                  styles.presetButton,
                  {backgroundColor: themeColors.preset},
                ]}>
                <Text style={[styles.presetText, {color: themeColors.ink}]}>
                  {preset.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            HABIT NAME
          </Text>
          <TextInput
            autoFocus
            onChangeText={onChangeName}
            placeholder="e.g. Drink water"
            placeholderTextColor={themeColors.muted}
            style={[
              styles.input,
              {borderBottomColor: themeColors.line, color: themeColors.ink},
            ]}
            value={name}
          />
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            DETAIL (OPTIONAL)
          </Text>
          <TextInput
            onChangeText={onChangeDetail}
            placeholder="e.g. 6 glasses"
            placeholderTextColor={themeColors.muted}
            style={[
              styles.input,
              {borderBottomColor: themeColors.line, color: themeColors.ink},
            ]}
            value={detail}
          />
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            REPEAT ON
          </Text>
          <View style={styles.repeatDayRow}>
            {WEEKDAYS.map(day => {
              const selected = repeatDays.includes(day);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: selected}}
                  accessibilityLabel={`Repeat on ${day}`}
                  key={day}
                  onPress={() => onToggleDay(day)}
                  style={[
                    styles.repeatDay,
                    {borderColor: themeColors.line},
                    selected && {
                      backgroundColor: actionColor,
                      borderColor: actionColor,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.repeatDayText,
                      {color: themeColors.muted},
                      selected && styles.repeatDayTextSelected,
                    ]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.inputLabel, {color: actionColor}]}>COLOR</Text>
          <View style={styles.choiceRow}>
            {COLORS.map(color => (
              <Pressable
                accessibilityLabel={`Choose color ${color}`}
                accessibilityRole="radio"
                accessibilityState={{selected: selectedColor === color}}
                key={color}
                onPress={() => onChangeColor(color)}
                style={[
                  styles.colorChoice,
                  {backgroundColor: color},
                  selectedColor === color && styles.selectedColor,
                ]}
              />
            ))}
          </View>
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            TIME OF DAY
          </Text>
          <View style={styles.choiceRow}>
            {TIMES_OF_DAY.map(option => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{selected: timeOfDay === option}}
                key={option}
                onPress={() =>
                  onChangeTimeOfDay(timeOfDay === option ? undefined : option)
                }
                style={[
                  styles.timeOfDayChoice,
                  {borderColor: themeColors.line},
                  timeOfDay === option && {
                    ...styles.selectedChoice,
                    borderColor: actionColor,
                  },
                ]}>
                <Text style={[styles.choiceText, {color: themeColors.ink}]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            LOCATION (OPTIONAL)
          </Text>
          <TextInput
            onChangeText={onChangeLocation}
            placeholder="e.g. Kitchen"
            placeholderTextColor={themeColors.muted}
            style={[
              styles.input,
              {borderBottomColor: themeColors.line, color: themeColors.ink},
            ]}
            value={location}
          />
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            DURATION (OPTIONAL)
          </Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={onChangeDuration}
            placeholder="Minutes"
            placeholderTextColor={themeColors.muted}
            style={[
              styles.input,
              {borderBottomColor: themeColors.line, color: themeColors.ink},
            ]}
            value={duration}
          />
          <Text style={[styles.inputLabel, {color: actionColor}]}>
            REMINDER (OPTIONAL)
          </Text>
          <TimePickerField
            clearTextStyle={[styles.clearReminderText, {color: actionColor}]}
            colors={{...themeColors, teal: actionColor}}
            inputStyle={[
              styles.timePickerButton,
              {borderBottomColor: themeColors.line},
            ]}
            onChange={onChangeReminder}
            onClear={() => onChangeReminder('')}
            value={reminder}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            style={({pressed}) => [
              styles.saveButton,
              {backgroundColor: actionColor},
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.saveButtonText}>Save habit</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const colors = {
  ink: '#202A2A',
  muted: '#778080',
  line: '#E5DED3',
  teal: '#286B69',
  paper: '#F7F3EC',
};

const styles = StyleSheet.create({
  modalBackdrop: {
    backgroundColor: 'rgba(32, 42, 42, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 22,
    paddingBottom: 30,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  modalTitle: {color: colors.ink, fontSize: 22, fontWeight: '700'},
  cancelText: {color: colors.teal, fontSize: 14, fontWeight: '600'},
  presetRow: {gap: 8},
  presetButton: {
    backgroundColor: '#EDE6DB',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  presetText: {color: colors.ink, fontSize: 12, fontWeight: '600'},
  inputLabel: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    color: colors.ink,
    fontSize: 16,
    paddingBottom: 9,
    paddingHorizontal: 0,
  },
  repeatDayRow: {flexDirection: 'row', justifyContent: 'space-between'},
  repeatDay: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 8,
    width: 39,
  },
  repeatDaySelected: {backgroundColor: colors.teal, borderColor: colors.teal},
  repeatDayText: {color: colors.muted, fontSize: 11, fontWeight: '700'},
  repeatDayTextSelected: {color: '#FFFFFF'},
  choiceRow: {flexDirection: 'row', gap: 8},
  timeOfDayChoice: {
    borderColor: colors.line,
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectedChoice: {backgroundColor: '#E0ECE7', borderColor: colors.teal},
  choiceText: {color: colors.ink, fontSize: 11, fontWeight: '700'},
  colorChoice: {borderRadius: 16, height: 32, width: 32},
  selectedColor: {borderColor: colors.ink, borderWidth: 3},
  timePickerButton: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingBottom: 9,
  },
  clearReminderText: {
    color: colors.teal,
    fontSize: 12,
    marginTop: 8,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: 5,
    marginTop: 26,
    paddingVertical: 14,
  },
  saveButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
  buttonPressed: {opacity: 0.7},
});
