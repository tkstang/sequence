import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/use-theme.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
}

export function Button({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  size = 'md',
  testID,
  variant = 'primary',
}: ButtonProps) {
  const theme = useTheme();
  const colors = theme.colors;
  const fill =
    variant === 'primary'
      ? colors.accent
      : variant === 'destructive'
        ? colors.danger
        : colors.surfaceRaised;
  const border =
    variant === 'secondary'
      ? colors.borderStrong
      : variant === 'destructive'
        ? colors.danger
        : colors.accent;
  const labelColor =
    disabled || variant === 'secondary' ? colors.text : colors.accentText;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.root,
        styles[size],
        { backgroundColor: fill, borderColor: border },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.label, { color: labelColor }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
});
