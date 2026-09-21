import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';
import { AttendanceStatus, ClassStatus, ClassType } from '../../types';

interface StatusChipProps {
  status: AttendanceStatus | ClassStatus | ClassType | string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md', style }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 25,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [status]);

  const getBadgeConfig = () => {
    switch (status) {
      case 'PRESENT':
        return { label: '✓ Present', bg: COLORS.successBg, text: COLORS.success, border: COLORS.successBorder };
      case 'ABSENT':
        return { label: '✕ Absent', bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.dangerBorder };
      case 'LEAVE':
        return { label: 'L Leave', bg: COLORS.warningBg, text: COLORS.warning, border: COLORS.warningBorder };
      case 'LATE':
        return { label: '⏱ Late', bg: COLORS.lateBg, text: COLORS.late, border: COLORS.lateBorder };
      case 'COMPLETED':
        return { label: '✓ Completed', bg: COLORS.successBg, text: COLORS.success, border: COLORS.successBorder };
      case 'SCHEDULED':
        return { label: '📅 Scheduled', bg: COLORS.infoBg, text: COLORS.info, border: COLORS.infoBorder };
      case 'CANCELLED':
        return { label: '✕ Cancelled', bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.dangerBorder };
      case 'COMPENSATION':
        return { label: '🔄 Compensation', bg: COLORS.warningBg, text: COLORS.warning, border: COLORS.warningBorder };
      case 'REGULAR':
        return { label: 'Regular', bg: COLORS.background, text: COLORS.textSecondary, border: COLORS.border };
      default:
        return { label: status, bg: COLORS.background, text: COLORS.textSecondary, border: COLORS.border };
    }
  };

  const config = getBadgeConfig();

  return (
    <Animated.View
      style={[
        styles.chip,
        { backgroundColor: config.bg, borderColor: config.border, transform: [{ scale: scaleAnim }] },
        size === 'sm' && styles.chipSm,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {config.label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  textSm: {
    fontSize: 11,
  },
});
