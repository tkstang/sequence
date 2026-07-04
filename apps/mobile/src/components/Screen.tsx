import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  nativeChromeSize,
  nativeSpace,
  nativeTypography,
} from '../theme/native-tokens.ts';
import { useTheme } from '../theme/use-theme.ts';

export interface ScreenProps {
  children: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  testID?: string;
}

export interface ScreenHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  testID?: string;
}

function renderContent(children: ReactNode, color: string): ReactNode {
  if (typeof children === 'string' || typeof children === 'number') {
    return <Text style={[styles.bodyText, { color }]}>{children}</Text>;
  }
  return children;
}

function ScreenRoot({ children, header, scroll = false, testID }: ScreenProps) {
  const { colors } = useTheme();
  const content = renderContent(children, colors.text);
  const contentTestID = testID === undefined ? undefined : `${testID}.content`;
  const scrollTestID = testID === undefined ? undefined : `${testID}.scroll`;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bg }]}
      testID={testID}
    >
      <View style={styles.root}>
        {header}
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.scroll}
            testID={scrollTestID}
          >
            <View style={styles.content} testID={contentTestID}>
              {content}
            </View>
          </ScrollView>
        ) : (
          <View
            style={[styles.content, styles.staticContent]}
            testID={contentTestID}
          >
            {content}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ScreenHeader({ actions, eyebrow, testID, title }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
      testID={testID}
    >
      <View style={styles.headerText}>
        {eyebrow === undefined ? null : (
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
            {eyebrow}
          </Text>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {actions === undefined ? null : (
        <View style={styles.headerActions}>{actions}</View>
      )}
    </View>
  );
}

export const Screen = Object.assign(ScreenRoot, {
  Header: ScreenHeader,
});

const styles = StyleSheet.create({
  safeArea: {
    display: 'flex',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: nativeSpace.lg,
    padding: nativeSpace.lg,
  },
  staticContent: {
    flex: 1,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    gap: nativeSpace.md,
    height: nativeChromeSize.screenHeader,
    justifyContent: 'space-between',
    paddingHorizontal: nativeSpace.lg,
    paddingVertical: 10,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: nativeSpace.xxs,
  },
  eyebrow: {
    ...nativeTypography.eyebrow,
    textTransform: 'uppercase',
  },
  title: {
    ...nativeTypography.title,
  },
  bodyText: {
    ...nativeTypography.body,
  },
  headerActions: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: nativeSpace.sm,
  },
});
