import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { signIn } from '../../auth/client.ts';
import { listGuestGames, type GuestGameEntry } from '../../auth/guest-store.ts';
import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { TextField } from '../../components/TextField.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

function isValidEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

function getAuthErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Unable to sign in. Try again.';
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guestGames, setGuestGames] = useState<GuestGameEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void listGuestGames().then((entries) => {
      if (isMounted) {
        setGuestGames(entries);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function submit() {
    const nextEmail = email.trim();

    if (!isValidEmail(nextEmail) || password.length === 0) {
      setError('Enter a valid email address.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.email({
        email: nextEmail,
        password,
      });

      if (result.error) {
        setError(getAuthErrorMessage(result.error));
        return;
      }

      router.replace('/');
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="Account"
          title="Log in"
          testID="auth.login.header"
        />
      }
      scroll
      testID={testId('auth', 'login')}
    >
      <Card elevation="raised" testID={testId('auth', 'login', 'card')}>
        <View style={styles.form}>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            Continue to your Sequence Online games.
          </Text>
          <TextField
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            testID={testId('auth', 'login', 'email')}
            textContentType="emailAddress"
            value={email}
          />
          <TextField
            accessibilityLabel="Password"
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            testID={testId('auth', 'login', 'password')}
            value={password}
          />
          {error === null ? null : (
            <Text
              accessibilityRole="alert"
              style={[styles.error, { color: colors.danger }]}
              testID={testId('auth', 'login', 'error')}
            >
              {error}
            </Text>
          )}
          <View style={styles.actions}>
            <Button
              disabled={isSubmitting}
              onPress={submit}
              testID={testId('auth', 'login', 'submit')}
            >
              Log in
            </Button>
            <Button
              disabled={isSubmitting}
              onPress={() => router.push('./signup')}
              testID={testId('auth', 'login', 'signup')}
              variant="secondary"
            >
              Create account
            </Button>
          </View>
        </View>
      </Card>
      {guestGames.length > 0 ? (
        <Card variant="sunken" testID="auth.guest.continueList">
          <View style={styles.guestList}>
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              Continue as guest
            </Text>
            {guestGames.map((game) => (
              <View key={game.gameId} style={styles.guestRow}>
                <View style={styles.guestCopy}>
                  <Text style={[styles.guestName, { color: colors.text }]}>
                    {game.guestName}
                  </Text>
                  <Text style={[styles.guestMeta, { color: colors.textMuted }]}>
                    {game.inviteCode}
                  </Text>
                </View>
                <Button
                  onPress={() => {
                    router.push(
                      `/game/${encodeURIComponent(game.gameId)}` as Href,
                    );
                  }}
                  testID={`auth.guest.continue.${game.gameId}`}
                  variant="secondary"
                >
                  Continue
                </Button>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  copy: {
    fontSize: 16,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  guestCopy: {
    flex: 1,
    gap: 2,
  },
  guestList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  guestMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  guestRow: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});
