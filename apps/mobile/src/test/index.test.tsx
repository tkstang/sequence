import { render } from '@testing-library/react-native';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: { pong: true },
    isError: false,
    isPending: false,
  })),
}));

jest.mock('../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    health: {
      ping: {
        queryOptions: jest.fn(() => ({
          queryKey: ['health', 'ping'],
          queryFn: jest.fn(),
        })),
      },
    },
  })),
}));

import HomeScreen from '../app/index.tsx';

describe('HomeScreen', () => {
  it('renders the app name and ping result', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Sequence Online')).toBeTruthy();
    expect(getByText('pong: true')).toBeTruthy();
  });
});
