import { fontSize, fontWeight, radius, space } from '@sequence/design-tokens';
import type { TextStyle, ViewStyle } from 'react-native';

type FontWeight = NonNullable<TextStyle['fontWeight']>;

function px(value: string): number {
  if (value === '0') {
    return 0;
  }
  if (!value.endsWith('px')) {
    throw new Error(`Expected px token, received ${value}`);
  }
  return Number.parseFloat(value);
}

function rem(value: string): number {
  if (!value.endsWith('rem')) {
    throw new Error(`Expected rem token, received ${value}`);
  }
  return Number.parseFloat(value) * 16;
}

export const nativeSpace = {
  none: px(space.none),
  xxs: px(space.xxs),
  xs: px(space.xs),
  sm: px(space.sm),
  md: px(space.md),
  lg: px(space.lg),
  xl: px(space.xl),
  xxl: px(space.xxl),
  xxxl: px(space.xxxl),
  huge: px(space.huge),
} as const;

export const nativeRadius = {
  sm: px(radius.sm),
  md: px(radius.md),
  lg: px(radius.lg),
  xl: px(radius.xl),
  pill: px(radius.pill),
} as const;

export const nativeFontSize = {
  xs: rem(fontSize.xs),
  sm: rem(fontSize.sm),
  smPlus: 13,
  mdMinus: 15,
  md: rem(fontSize.md),
  lg: rem(fontSize.lg),
  title: 22,
  xl: rem(fontSize.xl),
  xxl: rem(fontSize.xxl),
} as const;

export const nativeFontWeight = {
  regular: fontWeight.regular,
  medium: fontWeight.medium,
  semibold: fontWeight.semibold,
  bold: fontWeight.bold,
  black: fontWeight.black,
} as const satisfies Record<keyof typeof fontWeight, FontWeight>;

export const nativeTypography = {
  body: {
    fontSize: nativeFontSize.md,
    lineHeight: 22,
  },
  bodyCompact: {
    fontSize: nativeFontSize.mdMinus,
    lineHeight: 22,
  },
  buttonLabel: {
    fontSize: nativeFontSize.md,
    fontWeight: nativeFontWeight.bold,
    lineHeight: nativeSpace.xl,
  },
  badgeSmall: {
    fontSize: nativeFontSize.xs,
    fontWeight: nativeFontWeight.bold,
    lineHeight: nativeSpace.lg,
  },
  badgeMedium: {
    fontSize: nativeFontSize.smPlus,
    fontWeight: nativeFontWeight.bold,
    lineHeight: 18,
  },
  badgeLarge: {
    fontSize: nativeFontSize.sm,
    fontWeight: nativeFontWeight.bold,
    lineHeight: nativeSpace.xl,
  },
  detail: {
    fontSize: nativeFontSize.smPlus,
    lineHeight: 18,
  },
  eyebrow: {
    fontSize: nativeFontSize.xs,
    fontWeight: nativeFontWeight.bold,
    lineHeight: nativeSpace.lg,
  },
  title: {
    fontSize: nativeFontSize.title,
    fontWeight: nativeFontWeight.bold,
    lineHeight: 28,
  },
} as const satisfies Record<string, TextStyle>;

export const nativeChromeSize = {
  badge: {
    sm: nativeSpace.xxl,
    md: 28,
    lg: nativeSpace.xxxl,
  },
  control: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  screenHeader: 76,
} as const;

export const nativeShadow = {
  raised: {
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOffset: { height: nativeSpace.sm, width: nativeSpace.none },
    shadowOpacity: 0.14,
    shadowRadius: nativeSpace.xxl,
  },
} as const satisfies Record<string, ViewStyle>;
