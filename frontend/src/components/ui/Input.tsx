import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  isPassword = false,
  containerStyle,
  leftIcon,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
    if (onBlur) onBlur(e);
  };

  const borderColor = error
    ? COLORS.danger
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.primary],
      });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, isFocused && { color: COLORS.primary }]}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor },
          isFocused && SHADOWS.sm,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : null]}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    fontSize: 14,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    fontWeight: '500',
  },
});
