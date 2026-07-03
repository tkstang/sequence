import { render } from '@testing-library/react-native';

import HomeScreen from './index.tsx';

describe('HomeScreen', () => {
  it('renders the app name', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Sequence Online')).toBeTruthy();
  });
});
