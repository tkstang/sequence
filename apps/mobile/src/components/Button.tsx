import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  nativeChromeSize,
  nativeRadius,
  nativeSpace,
  nativeTypography,
} from '../theme/native-tokens.ts';
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
    borderRadius: nativeRadius.md,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  sm: {
    minHeight: nativeChromeSize.control.sm,
    paddingHorizontal: nativeSpace.md,
    paddingVertical: nativeSpace.sm,
  },
  md: {
    minHeight: nativeChromeSize.control.md,
    paddingHorizontal: nativeSpace.lg,
    paddingVertical: 10,
  },
  lg: {
    minHeight: nativeChromeSize.control.lg,
    paddingHorizontal: nativeSpace.xl,
    paddingVertical: nativeSpace.md,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...nativeTypography.buttonLabel,
    textAlign: 'center',
  },
});
