import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button.tsx';
import { Screen } from '../../components/Screen.tsx';
import { TextField } from '../../components/TextField.tsx';
import { normalizeInviteCode } from '../../features/join/PreviewCard.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

export default function JoinCodeEntryScreen() {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const normalized = normalizeInviteCode(code);
    if (normalized.length === 0) {
      setError('Enter an invite code.');
      return;
    }
    setError(null);
    router.push(`/join/${encodeURIComponent(normalized)}` as Href);
  }

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="Invite"
          title="Join game"
          testID={testId('join', 'entry', 'header')}
        />
      }
      testID={testId('join', 'entry', 'screen')}
    >
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Invite code</Text>
        <TextField
          accessibilityLabel="Invite code"
          onChangeText={setCode}
          placeholder="ABCD2345EF"
          size="lg"
          testID={testId('join', 'entry', 'code')}
          value={code}
        />
        {error ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: colors.danger }]}
          >
            {error}
          </Text>
        ) : null}
        <Button
          onPress={submit}
          size="lg"
          testID={testId('join', 'entry', 'submit')}
        >
          Preview game
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
});
