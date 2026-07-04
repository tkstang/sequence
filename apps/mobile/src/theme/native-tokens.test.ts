import { fontSize, radius, space } from '@sequence/design-tokens';

import {
  nativeChromeSize,
  nativeFontSize,
  nativeRadius,
  nativeShadow,
  nativeSpace,
  nativeTypography,
} from './native-tokens.ts';

describe('native theme tokens', () => {
  it('maps shared px dimension tokens to React Native numbers', () => {
    expect(nativeSpace.md).toBe(Number.parseFloat(space.md));
    expect(nativeSpace.xxl).toBe(Number.parseFloat(space.xxl));
    expect(nativeRadius.md).toBe(Number.parseFloat(radius.md));
    expect(nativeRadius.pill).toBe(Number.parseFloat(radius.pill));
  });

  it('maps shared rem font-size tokens to React Native dp values', () => {
    expect(nativeFontSize.md).toBe(Number.parseFloat(fontSize.md) * 16);
    expect(nativeFontSize.xl).toBe(Number.parseFloat(fontSize.xl) * 16);
  });

  it('centralizes native-only chrome sizes and typography exceptions', () => {
    expect(nativeChromeSize.control).toMatchObject({
      sm: 36,
      md: 44,
      lg: 52,
    });
    expect(nativeTypography.buttonLabel).toMatchObject({
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 20,
    });
    expect(nativeShadow.raised).toMatchObject({
      elevation: 3,
      shadowRadius: 24,
    });
  });
});
