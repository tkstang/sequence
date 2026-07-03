import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    borderRadius: 999,
    justifyContent: 'center',
  },
  sm: {
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  md: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lg: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  smLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  mdLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  lgLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
});
