var mockStorage = new Map<string, string>();
var mockSecureStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
  },
}));

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStorage.delete(key);
  }),
  getItemAsync: jest.fn(
    async (key: string) => mockSecureStorage.get(key) ?? null,
  ),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStorage.set(key, value);
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  getGuestToken,
  listGuestGames,
  removeGuestGame,
  saveGuestGame,
  saveGuestToken,
} from './guest-store.ts';

beforeEach(() => {
  mockStorage = new Map();
  mockSecureStorage = new Map();
  jest.clearAllMocks();
});

describe('guest store', () => {
  it('round-trips a guest token and registry entry', async () => {
    await saveGuestToken('7ed1137a-2334-4bde-82ba-75c742d570d1', 'raw-token');
    await saveGuestGame({
      gameId: '7ed1137a-2334-4bde-82ba-75c742d570d1',
      guestName: 'Ada',
      inviteCode: 'ABCD2345EF',
      joinedAt: '2026-07-03T12:00:00.000Z',
      lastKnownStatus: 'lobby',
    });

    await expect(
      getGuestToken('7ed1137a-2334-4bde-82ba-75c742d570d1'),
    ).resolves.toBe('raw-token');
    await expect(listGuestGames()).resolves.toEqual([
      {
        gameId: '7ed1137a-2334-4bde-82ba-75c742d570d1',
        guestName: 'Ada',
        inviteCode: 'ABCD2345EF',
        joinedAt: '2026-07-03T12:00:00.000Z',
        lastKnownStatus: 'lobby',
      },
    ]);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sequence.guest.7ed1137a-2334-4bde-82ba-75c742d570d1',
      'raw-token',
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'sequence-guest-games',
      expect.any(String),
    );
  });

  it('orders guest games by most recent join timestamp', async () => {
    await saveGuestGame({
      gameId: 'older-game',
      guestName: 'Grace',
      inviteCode: 'OLDER',
      joinedAt: '2026-07-03T11:00:00.000Z',
      lastKnownStatus: 'active',
    });
    await saveGuestGame({
      gameId: 'newer-game',
      guestName: 'Ada',
      inviteCode: 'NEWER',
      joinedAt: '2026-07-03T12:00:00.000Z',
      lastKnownStatus: 'lobby',
    });

    await expect(listGuestGames()).resolves.toMatchObject([
      { gameId: 'newer-game' },
      { gameId: 'older-game' },
    ]);
  });

  it('removes both the raw token and registry entry', async () => {
    await saveGuestToken('game-to-remove', 'raw-token');
    await saveGuestGame({
      gameId: 'game-to-remove',
      guestName: 'Ada',
      inviteCode: 'REMOVE',
      joinedAt: '2026-07-03T12:00:00.000Z',
      lastKnownStatus: 'active',
    });

    await removeGuestGame('game-to-remove');

    await expect(getGuestToken('game-to-remove')).resolves.toBeNull();
    await expect(listGuestGames()).resolves.toEqual([]);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'sequence.guest.game-to-remove',
    );
  });
});
