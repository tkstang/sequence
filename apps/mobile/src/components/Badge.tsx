import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  nativeChromeSize,
  nativeRadius,
  nativeSpace,
  nativeTypography,
} from '../theme/native-tokens.ts';
import { useTheme } from '../theme/use-theme.ts';

export type BadgeVariant =
  | 'neutral'
  | 'accent'
  | 'saved'
  | 'frozen'
  | 'teamBlue'
  | 'teamGreen'
  | 'teamRed';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  testID?: string;
}

export function Badge({
  children,
  size = 'md',
  testID,
  variant = 'neutral',
}: BadgeProps) {
  const { colors } = useTheme();
  const fill =
    variant === 'neutral'
      ? colors.neutralBadgeBg
      : variant === 'accent'
        ? colors.accent
        : variant === 'saved'
          ? colors.savedBg
          : variant === 'frozen'
            ? colors.frozenBg
            : variant === 'teamBlue'
              ? colors.teamBlue
              : variant === 'teamGreen'
                ? colors.teamGreen
                : colors.teamRed;
  const labelColor =
    variant === 'saved'
      ? colors.savedFg
      : variant === 'frozen'
        ? colors.frozenFg
        : variant === 'neutral'
          ? colors.text
          : colors.accentText;

  return (
    <View
      style={[styles.root, styles[size], { backgroundColor: fill }]}
      testID={testID}
    >
      <Text
        style={[styles.label, styles[`${size}Label`], { color: labelColor }]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: nativeRadius.pill,
    justifyContent: 'center',
  },
  sm: {
    minHeight: nativeChromeSize.badge.sm,
    paddingHorizontal: nativeSpace.sm,
    paddingVertical: nativeSpace.xs,
  },
  md: {
    minHeight: nativeChromeSize.badge.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lg: {
    minHeight: nativeChromeSize.badge.lg,
    paddingHorizontal: nativeSpace.md,
    paddingVertical: 6,
  },
  label: {
    textAlign: 'center',
  },
  smLabel: {
    ...nativeTypography.badgeSmall,
  },
  mdLabel: {
    ...nativeTypography.badgeMedium,
  },
  lgLabel: {
    ...nativeTypography.badgeLarge,
  },
});
