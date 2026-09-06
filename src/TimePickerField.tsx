import React, {useState} from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import {isValidReminderTime} from './data/habitRepository';

type TimePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  colors: {
    ink: string;
    muted: string;
    line: string;
    teal: string;
  };
  inputStyle: object;
  clearTextStyle: object;
};

function timeToDate(value: string): Date {
  const date = new Date();
  const [hours, minutes] = isValidReminderTime(value)
    ? value.split(':').map(Number)
    : [8, 0];
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export function TimePickerField({
  value,
  onChange,
  onClear,
  colors,
  inputStyle,
  clearTextStyle,
}: TimePickerFieldProps): React.JSX.Element {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const pickerValue = timeToDate(value);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      onChange(formatTime(date));
    }
    setIsPickerVisible(false);
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          value ? `Reminder time ${value}` : 'Choose reminder time'
        }
        onPress={() => setIsPickerVisible(true)}
        style={inputStyle}>
        <Text style={{color: value ? colors.ink : colors.muted}}>
          {value || 'Choose a time'}
        </Text>
      </Pressable>
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear reminder time"
          onPress={onClear}>
          <Text style={clearTextStyle}>Clear reminder</Text>
        </Pressable>
      ) : null}
      {isPickerVisible ? (
        <DateTimePicker
          display="spinner"
          is24Hour={Platform.OS === 'android'}
          mode="time"
          value={pickerValue}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
