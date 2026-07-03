import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { signUp } from '../../auth/client.ts';
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

  return 'Unable to create your account. Try again.';
}

export default function SignupScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    const nextName = name.trim();
    const nextEmail = email.trim();

    if (
      nextName.length === 0 ||
      !isValidEmail(nextEmail) ||
      password.length === 0
    ) {
      setError('Enter your name, email, and a password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp.email({
        email: nextEmail,
        name: nextName,
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
          title="Create account"
          testID="auth.signup.header"
        />
      }
      scroll
      testID={testId('auth', 'signup')}
    >
      <Card elevation="raised" testID={testId('auth', 'signup', 'card')}>
        <View style={styles.form}>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            Start a registered Sequence Online session.
          </Text>
          <TextField
            accessibilityLabel="Name"
            onChangeText={setName}
            placeholder="Name"
            testID={testId('auth', 'signup', 'name')}
            value={name}
          />
          <TextField
            accessibilityLabel="Email"
            onChangeText={setEmail}
            placeholder="Email"
            testID={testId('auth', 'signup', 'email')}
            value={email}
          />
          <TextField
            accessibilityLabel="Password"
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            testID={testId('auth', 'signup', 'password')}
            value={password}
          />
          {error === null ? null : (
            <Text
              accessibilityRole="alert"
              style={[styles.error, { color: colors.danger }]}
              testID={testId('auth', 'signup', 'error')}
            >
              {error}
            </Text>
          )}
          <View style={styles.actions}>
            <Button
              disabled={isSubmitting}
              onPress={submit}
              testID={testId('auth', 'signup', 'submit')}
            >
              Create account
            </Button>
            <Button
              disabled={isSubmitting}
              onPress={() => router.push('./login')}
              testID={testId('auth', 'signup', 'login')}
              variant="secondary"
            >
              Log in
            </Button>
          </View>
        </View>
      </Card>
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
});
