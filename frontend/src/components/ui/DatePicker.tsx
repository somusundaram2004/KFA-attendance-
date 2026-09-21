import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { formatDateDDMMYYYY, getTodayISODate } from '../../utils/date';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  containerStyle?: ViewStyle;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  containerStyle,
}) => {
  const displayDate = formatDateDDMMYYYY(value || getTodayISODate());

  const handlePrevDay = () => {
    const cur = new Date(value || getTodayISODate());
    cur.setDate(cur.getDate() - 1);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
  };

  const handleNextDay = () => {
    const cur = new Date(value || getTodayISODate());
    cur.setDate(cur.getDate() + 1);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
  };

  const handleSetToday = () => {
    onChange(getTodayISODate());
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pickerWrapper}>
        <TouchableOpacity style={styles.navButton} onPress={handlePrevDay} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateDisplay} onPress={handleSetToday} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>{displayDate}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={handleNextDay} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 48,
  },
  navButton: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
});
