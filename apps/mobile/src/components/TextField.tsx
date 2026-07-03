import { css, html } from 'react-strict-dom';

import { color } from '../theme/vars.css.ts';

export type TextFieldSize = 'sm' | 'md' | 'lg';

export interface TextFieldProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: TextFieldSize;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  onChangeText?: (value: string) => void;
}

export function TextField({
  accessibilityLabel,
  defaultValue,
  disabled = false,
  onChangeText,
  placeholder,
  size = 'md',
  testID,
  value,
}: TextFieldProps) {
  return (
    <html.input
      aria-disabled={disabled}
      aria-label={accessibilityLabel}
      data-testid={testID}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={
        disabled
          ? undefined
          : (event: { target: { value: string } }) => {
              onChangeText?.(event.target.value);
            }
      }
      placeholder={placeholder}
      style={[styles.root, styles[size], disabled ? styles.disabled : null]}
      type="text"
      value={value}
    />
  );
}

const styles = css.create({
  root: {
    backgroundColor: color.surfaceRaised,
    borderColor: color.borderStrong,
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    color: color.text,
    fontSize: 16,
    lineHeight: 20,
  },
  sm: {
    minHeight: 36,
    paddingBlock: 8,
    paddingInline: 12,
  },
  md: {
    minHeight: 44,
    paddingBlock: 10,
    paddingInline: 14,
  },
  lg: {
    minHeight: 52,
    paddingBlock: 12,
    paddingInline: 16,
  },
  disabled: {
    backgroundColor: color.surfaceSunken,
    color: color.textMuted,
    opacity: 0.65,
  },
});
