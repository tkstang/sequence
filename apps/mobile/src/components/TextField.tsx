import { StyleSheet, TextInput } from 'react-native';

import { useTheme } from '../theme/use-theme.ts';

export type TextFieldSize = 'sm' | 'md' | 'lg';

export interface TextFieldProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
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
  secureTextEntry = false,
  size = 'md',
  testID,
  value,
}: TextFieldProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      defaultValue={defaultValue}
      editable={!disabled}
      onChangeText={disabled ? undefined : onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      secureTextEntry={secureTextEntry}
      style={[
        styles.root,
        styles[size],
        {
          backgroundColor: disabled
            ? colors.surfaceSunken
            : colors.surfaceRaised,
          borderColor: colors.borderStrong,
          color: disabled ? colors.textMuted : colors.text,
        },
        disabled ? styles.disabled : null,
      ]}
      testID={testID}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.65,
  },
});
