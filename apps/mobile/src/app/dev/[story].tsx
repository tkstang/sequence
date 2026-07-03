import { router, useLocalSearchParams } from 'expo-router';
import { css, html } from 'react-strict-dom';

import { Badge } from '../../components/Badge.tsx';
import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { TextField } from '../../components/TextField.tsx';
import { findKitStory, type KitStoryFixture } from '../../dev/stories.ts';
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
      testID="dev.story.theme"
      variant="secondary"
    >
      {theme.mode}:{theme.scheme}
    </Button>
  );
}

function StoryFixture({ fixture }: { fixture: KitStoryFixture }) {
  switch (fixture.component) {
    case 'Button':
      return <Button {...fixture.props} />;
    case 'TextField':
      return <TextField {...fixture.props} />;
    case 'Card':
      return (
        <Card
          elevation={fixture.props.elevation}
          testID={fixture.props.testID}
          variant={fixture.props.variant}
        >
          <html.span style={styles.cardText}>
            {fixture.props.children}
          </html.span>
        </Card>
      );
    case 'Badge':
      return <Badge {...fixture.props} />;
    case 'Screen':
      return (
        <Card testID="dev.story.screen.preview" variant="raised">
          <html.div style={styles.screenPreview}>
            <Screen.Header
              eyebrow={fixture.props.eyebrow}
              title={fixture.props.title}
            />
            <html.div style={styles.screenBody}>
              <html.span style={styles.cardText}>
                {fixture.props.children}
              </html.span>
              <Badge
                size="sm"
                variant={fixture.props.scroll ? 'accent' : 'neutral'}
              >
                {fixture.props.scroll ? 'scroll' : 'static'}
              </Badge>
            </html.div>
          </html.div>
        </Card>
      );
  }
}

export default function DevStoryDetail() {
  const params = useLocalSearchParams<{ story?: string | string[] }>();
  const storyId = Array.isArray(params.story) ? params.story[0] : params.story;
  const story = findKitStory(storyId);

  if (story === undefined) {
    return (
      <Screen
        header={
          <Screen.Header
            actions={<ThemeToggle />}
            eyebrow="Development only"
            title="Story not found"
          />
        }
        testID="dev.story.missing"
      >
        <Card>
          <html.div style={styles.emptyState}>
            <html.span style={styles.title}>Unknown story</html.span>
            <Button
              onPress={() => router.replace('./')}
              testID="dev.story.missing.back"
              variant="primary"
            >
              Back to stories
            </Button>
          </html.div>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <Screen.Header
          actions={<ThemeToggle />}
          eyebrow="Development only"
          title={story.title}
        />
      }
      scroll
      testID={`dev.story.${story.id}`}
    >
      <html.div style={styles.stack}>
        <Button
          onPress={() => router.replace('./')}
          size="sm"
          testID="dev.story.back"
          variant="secondary"
        >
          Back
        </Button>
        <html.span style={styles.description}>{story.description}</html.span>
        {story.fixtures.map((fixture) => (
          <Card key={fixture.label} testID={`dev.fixture.${story.id}`}>
            <html.div style={styles.fixture}>
              <html.span style={styles.fixtureLabel}>{fixture.label}</html.span>
              <StoryFixture fixture={fixture} />
            </html.div>
          </Card>
        ))}
      </html.div>
    </Screen>
  );
}

const styles = css.create({
  stack: {
    display: 'flex',
    gap: 12,
  },
  description: {
    color: color.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  fixture: {
    display: 'flex',
    gap: 10,
  },
  fixtureLabel: {
    color: color.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardText: {
    color: color.text,
    fontSize: 15,
    lineHeight: 22,
  },
  screenPreview: {
    borderColor: color.border,
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  screenBody: {
    backgroundColor: color.bg,
    display: 'flex',
    gap: 10,
    padding: 16,
  },
  emptyState: {
    display: 'flex',
    gap: 12,
  },
  title: {
    color: color.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
});
