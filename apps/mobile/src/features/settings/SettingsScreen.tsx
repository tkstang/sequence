import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { signOut } from '../../auth/client.ts';
import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme, type ThemeMode } from '../../theme/use-theme.ts';
import { getAppVersion } from './app-version.ts';

const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string }> = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

async function logout() {
  await signOut();
  router.replace('./login');
}

export function SettingsScreen() {
  const theme = useTheme();
  const colors = theme.colors;

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="Account"
          title="Settings"
          testID={testId('settings', 'header')}
        />
      }
      scroll
      testID={testId('settings', 'screen')}
    >
      <Card testID={testId('settings', 'theme')}>
        <View style={styles.cardStack}>
          <View style={styles.copyStack}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Theme
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              Choose how Sequence Online appears on this device.
            </Text>
          </View>
          <View
            accessibilityRole="tablist"
            style={[styles.segmented, { borderColor: colors.borderStrong }]}
            testID={testId('settings', 'theme', 'tabs')}
          >
            {THEME_OPTIONS.map((option) => {
              const selected = theme.mode === option.mode;
              return (
                <Pressable
                  accessibilityLabel={`Use ${option.label.toLowerCase()} theme`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={option.mode}
                  onPress={() => theme.setMode(option.mode)}
                  style={({ pressed }) => [
                    styles.segment,
                    {
                      backgroundColor: selected
                        ? colors.accent
                        : colors.surfaceRaised,
                      borderColor: colors.border,
                    },
                    pressed ? styles.pressed : null,
                  ]}
                  testID={testId('settings', 'theme', option.mode)}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: selected ? colors.accentText : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <Card testID={testId('settings', 'account')}>
        <View style={styles.cardStack}>
          <View style={styles.copyStack}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              Sign out on this device when you are finished playing.
            </Text>
          </View>
          <Button
            onPress={logout}
            testID={testId('settings', 'logout')}
            variant="destructive"
          >
            Log out
          </Button>
        </View>
      </Card>

      <Text
        style={[styles.version, { color: colors.textMuted }]}
        testID={testId('settings', 'version')}
      >
        Version {getAppVersion()}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  cardStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  copyStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  pressed: {
    opacity: 0.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  segmented: {
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  version: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
