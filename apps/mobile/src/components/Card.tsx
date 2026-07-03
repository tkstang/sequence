import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/use-theme.ts';

export type CardVariant = 'surface' | 'raised' | 'sunken' | 'accent';
export type CardElevation = 'none' | 'raised';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  elevation?: CardElevation;
  testID?: string;
}

function renderContent(children: ReactNode, color: string): ReactNode {
  if (typeof children === 'string' || typeof children === 'number') {
    return <Text style={[styles.text, { color }]}>{children}</Text>;
  }
  return children;
}

export function Card({
  children,
  elevation = 'none',
  testID,
  variant = 'surface',
}: CardProps) {
  const { colors } = useTheme();
  const surface =
    variant === 'raised'
      ? colors.surfaceRaised
      : variant === 'sunken'
        ? colors.surfaceSunken
        : variant === 'accent'
          ? colors.felt
          : colors.surface;
  const border = variant === 'accent' ? colors.accent : colors.border;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: surface, borderColor: border },
        elevation === 'raised' ? styles.elevationRaised : null,
      ]}
      testID={testID}
    >
      {renderContent(children, colors.text)}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 16,
  },
  elevationRaised: {
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});
