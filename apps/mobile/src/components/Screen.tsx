import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { css, html } from 'react-strict-dom';

import { color } from '../theme/vars.css.ts';

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

function ScreenRoot({ children, header, scroll = false, testID }: ScreenProps) {
  const contentTestID = testID === undefined ? undefined : `${testID}.content`;
  const scrollTestID = testID === undefined ? undefined : `${testID}.scroll`;

  return (
    <SafeAreaView style={nativeStyles.safeArea} testID={testID}>
      <html.div style={styles.root}>
        {header}
        {scroll ? (
          <ScrollView
            contentContainerStyle={nativeStyles.scrollContent}
            style={nativeStyles.scroll}
            testID={scrollTestID}
          >
            <html.div data-testid={contentTestID} style={styles.content}>
              {children}
            </html.div>
          </ScrollView>
        ) : (
          <html.div
            data-testid={contentTestID}
            style={[styles.content, styles.staticContent]}
          >
            {children}
          </html.div>
        )}
      </html.div>
    </SafeAreaView>
  );
}

function ScreenHeader({ actions, eyebrow, testID, title }: ScreenHeaderProps) {
  return (
    <html.div data-testid={testID} style={styles.header}>
      <html.div style={styles.headerText}>
        {eyebrow === undefined ? null : (
          <html.span style={styles.eyebrow}>{eyebrow}</html.span>
        )}
        <html.span style={styles.title}>{title}</html.span>
      </html.div>
      {actions === undefined ? null : (
        <html.div style={styles.headerActions}>{actions}</html.div>
      )}
    </html.div>
  );
}

export const Screen = Object.assign(ScreenRoot, {
  Header: ScreenHeader,
});

const nativeStyles = StyleSheet.create({
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
});

const styles = css.create({
  root: {
    backgroundColor: color.bg,
    display: 'flex',
    minHeight: '100%',
  },
  content: {
    display: 'flex',
    flex: 1,
    gap: 16,
    padding: 16,
  },
  staticContent: {
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: color.surface,
    borderBottomColor: color.border,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingBlock: 10,
    paddingInline: 16,
  },
  headerText: {
    display: 'flex',
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  title: {
    color: color.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  headerActions: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
});
