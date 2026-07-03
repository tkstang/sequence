import type { BadgeProps } from '../components/Badge.tsx';
import type { ButtonProps } from '../components/Button.tsx';
import type { CardProps } from '../components/Card.tsx';
import type { ScreenProps } from '../components/Screen.tsx';
import type { TextFieldProps } from '../components/TextField.tsx';

export type KitStoryId = 'button' | 'text-field' | 'card' | 'badge' | 'screen';

export type KitStoryFixture =
  | {
      component: 'Button';
      label: string;
      props: Omit<ButtonProps, 'onPress'>;
    }
  | {
      component: 'TextField';
      label: string;
      props: TextFieldProps;
    }
  | {
      component: 'Card';
      label: string;
      props: Omit<CardProps, 'children'> & { children: string };
    }
  | {
      component: 'Badge';
      label: string;
      props: BadgeProps;
    }
  | {
      component: 'Screen';
      label: string;
      props: Pick<ScreenProps, 'scroll'> & {
        eyebrow?: string;
        title: string;
        children: string;
      };
    };

export interface KitStory {
  id: KitStoryId;
  title: string;
  description: string;
  fixtures: readonly KitStoryFixture[];
}

export const kitStories = [
  {
    id: 'button',
    title: 'Button',
    description: 'Primary actions, secondary options, and destructive choices.',
    fixtures: [
      {
        component: 'Button',
        label: 'Primary',
        props: {
          accessibilityLabel: 'Start game',
          children: 'Start game',
          size: 'md',
          testID: 'dev.story.button.primary',
          variant: 'primary',
        },
      },
      {
        component: 'Button',
        label: 'Secondary small',
        props: {
          children: 'Invite',
          size: 'sm',
          testID: 'dev.story.button.secondary',
          variant: 'secondary',
        },
      },
      {
        component: 'Button',
        label: 'Disabled destructive',
        props: {
          children: 'Resign',
          disabled: true,
          size: 'lg',
          testID: 'dev.story.button.disabled',
          variant: 'destructive',
        },
      },
    ],
  },
  {
    id: 'text-field',
    title: 'TextField',
    description: 'Single-line text entry at each supported control size.',
    fixtures: [
      {
        component: 'TextField',
        label: 'Small',
        props: {
          defaultValue: 'Tess',
          placeholder: 'Display name',
          size: 'sm',
          testID: 'dev.story.text-field.small',
        },
      },
      {
        component: 'TextField',
        label: 'Medium',
        props: {
          placeholder: 'Invite code',
          size: 'md',
          testID: 'dev.story.text-field.medium',
        },
      },
      {
        component: 'TextField',
        label: 'Disabled large',
        props: {
          disabled: true,
          placeholder: 'Locked setting',
          size: 'lg',
          testID: 'dev.story.text-field.disabled',
        },
      },
    ],
  },
  {
    id: 'card',
    title: 'Card',
    description: 'Surface containers for lobby panels and game state groups.',
    fixtures: [
      {
        component: 'Card',
        label: 'Surface',
        props: {
          children: 'Waiting for your next turn.',
          testID: 'dev.story.card.surface',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Raised',
        props: {
          children: 'Round summary with elevated emphasis.',
          elevation: 'raised',
          testID: 'dev.story.card.raised',
          variant: 'raised',
        },
      },
      {
        component: 'Card',
        label: 'Accent',
        props: {
          children: 'Team sequence claimed.',
          testID: 'dev.story.card.accent',
          variant: 'accent',
        },
      },
    ],
  },
  {
    id: 'badge',
    title: 'Badge',
    description: 'Compact labels for teams, status, and saved/frozen cells.',
    fixtures: [
      {
        component: 'Badge',
        label: 'Neutral',
        props: {
          children: 'Ready',
          testID: 'dev.story.badge.neutral',
          variant: 'neutral',
        },
      },
      {
        component: 'Badge',
        label: 'Team colors',
        props: {
          children: 'Blue team',
          size: 'lg',
          testID: 'dev.story.badge.team-blue',
          variant: 'teamBlue',
        },
      },
      {
        component: 'Badge',
        label: 'Frozen',
        props: {
          children: 'Frozen',
          size: 'sm',
          testID: 'dev.story.badge.frozen',
          variant: 'frozen',
        },
      },
    ],
  },
  {
    id: 'screen',
    title: 'Screen',
    description: 'Page shell with safe-area layout, headers, and scroll mode.',
    fixtures: [
      {
        component: 'Screen',
        label: 'Static shell',
        props: {
          children: 'Dashboard content area',
          eyebrow: 'Dev',
          title: 'Dashboard',
        },
      },
      {
        component: 'Screen',
        label: 'Scrollable shell',
        props: {
          children: 'Long match history content',
          scroll: true,
          title: 'History',
        },
      },
    ],
  },
] satisfies readonly KitStory[];

export function findKitStory(id: string | undefined): KitStory | undefined {
  return kitStories.find((story) => story.id === id);
}
