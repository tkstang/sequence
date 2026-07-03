import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { kitStories } from '../../dev/stories.ts';
import { useTheme, type ThemeMode } from '../../theme/use-theme.ts';

function nextMode(mode: ThemeMode): ThemeMode {
  return mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
}

function ThemeToggle() {
  const theme = useTheme();
  const next = nextMode(theme.mode);

  return (
    <Button
      accessibilityLabel={`Switch theme to ${next}`}
      onPress={() => theme.setMode(next)}
      size="sm"
      testID="dev.playground.theme"
      variant="secondary"
    >
      {theme.mode}:{theme.scheme}
    </Button>
  );
}

export default function DevPlaygroundIndex() {
  const { colors } = useTheme();

  return (
    <Screen
      header={
        <Screen.Header
          actions={<ThemeToggle />}
          eyebrow="Development only"
          title="Kit playground"
        />
      }
      scroll
      testID="dev.playground"
    >
      <View style={styles.list}>
        {kitStories.map((story) => (
          <Card key={story.id} testID={`dev.story-link.${story.id}`}>
            <View style={styles.storyCard}>
              <View style={styles.storyCopy}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {story.title}
                </Text>
                <Text style={[styles.description, { color: colors.textMuted }]}>
                  {story.description}
                </Text>
              </View>
              <Button
                accessibilityLabel={`Open ${story.title} story`}
                onPress={() => router.push(`./${story.id}`)}
                size="sm"
                testID={`dev.story-link.${story.id}.open`}
                variant="primary"
              >
                Open
              </Button>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  storyCard: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  storyCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
