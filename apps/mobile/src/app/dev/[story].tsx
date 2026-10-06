import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../components/Badge.tsx';
import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { TextField } from '../../components/TextField.tsx';
import { findKitStory, type KitStoryFixture } from '../../dev/stories.ts';
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
      testID="dev.story.theme"
      variant="secondary"
    >
      {theme.mode}:{theme.scheme}
    </Button>
  );
}

function StoryFixture({ fixture }: { fixture: KitStoryFixture }) {
  const { colors } = useTheme();

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
          {fixture.props.children}
        </Card>
      );
    case 'Badge':
      return <Badge {...fixture.props} />;
    case 'Screen':
      return (
        <Card testID="dev.story.screen.preview" variant="raised">
          <View style={[styles.screenPreview, { borderColor: colors.border }]}>
            <Screen.Header
              eyebrow={fixture.props.eyebrow}
              title={fixture.props.title}
            />
            <View style={[styles.screenBody, { backgroundColor: colors.bg }]}>
              <Text style={[styles.cardText, { color: colors.text }]}>
                {fixture.props.children}
              </Text>
              <Badge
                size="sm"
                variant={fixture.props.scroll ? 'accent' : 'neutral'}
              >
                {fixture.props.scroll ? 'scroll' : 'static'}
              </Badge>
            </View>
          </View>
        </Card>
      );
  }
}

export default function DevStoryDetail() {
  const params = useLocalSearchParams<{ story?: string | string[] }>();
  const storyId = Array.isArray(params.story) ? params.story[0] : params.story;
  const story = findKitStory(storyId);
  const { colors } = useTheme();

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
          <View style={styles.emptyState}>
            <Text style={[styles.title, { color: colors.text }]}>
              Unknown story
            </Text>
            <Button
              onPress={() => router.replace('./')}
              testID="dev.story.missing.back"
              variant="primary"
            >
              Back to stories
            </Button>
          </View>
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
      <View style={styles.stack}>
        <Button
          onPress={() => router.replace('./')}
          size="sm"
          testID="dev.story.back"
          variant="secondary"
        >
          Back
        </Button>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {story.description}
        </Text>
        {story.fixtures.map((fixture) => (
          <Card key={fixture.label} testID={`dev.fixture.${story.id}`}>
            <View style={styles.fixture}>
              <Text style={[styles.fixtureLabel, { color: colors.text }]}>
                {fixture.label}
              </Text>
              <StoryFixture fixture={fixture} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  fixture: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  fixtureLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  screenPreview: {
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  screenBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 16,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
});
