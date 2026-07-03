import { router } from 'expo-router';
import { css, html } from 'react-strict-dom';

import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { kitStories } from '../../dev/stories.ts';
import { useTheme, type ThemeMode } from '../../theme/use-theme.ts';
import { color } from '../../theme/vars.css.ts';

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
      <html.div style={styles.list}>
        {kitStories.map((story) => (
          <Card key={story.id} testID={`dev.story-link.${story.id}`}>
            <html.div style={styles.storyCard}>
              <html.div style={styles.storyCopy}>
                <html.span style={styles.title}>{story.title}</html.span>
                <html.span style={styles.description}>
                  {story.description}
                </html.span>
              </html.div>
              <Button
                accessibilityLabel={`Open ${story.title} story`}
                onPress={() => router.push(`./${story.id}`)}
                size="sm"
                testID={`dev.story-link.${story.id}.open`}
                variant="primary"
              >
                Open
              </Button>
            </html.div>
          </Card>
        ))}
      </html.div>
    </Screen>
  );
}

const styles = css.create({
  list: {
    display: 'flex',
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
    flex: 1,
    gap: 4,
  },
  title: {
    color: color.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  description: {
    color: color.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
