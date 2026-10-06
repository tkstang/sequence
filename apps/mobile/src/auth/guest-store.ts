import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const GUEST_GAME_REGISTRY_KEY = 'sequence-guest-games';
export const GUEST_TOKEN_KEY_PREFIX = 'sequence.guest.';

export type GuestGameEntry = {
  gameId: string;
  inviteCode: string;
  guestName: string;
  joinedAt: string;
  lastKnownStatus: string;
};

function guestTokenKey(gameId: string) {
  return `${GUEST_TOKEN_KEY_PREFIX}${gameId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toGuestGameEntry(value: unknown): GuestGameEntry | null {
  if (!isRecord(value)) return null;

  const { gameId, guestName, inviteCode, joinedAt, lastKnownStatus } = value;

  if (
    typeof gameId !== 'string' ||
    typeof guestName !== 'string' ||
    typeof inviteCode !== 'string' ||
    typeof joinedAt !== 'string' ||
    typeof lastKnownStatus !== 'string'
  ) {
    return null;
  }

  return { gameId, guestName, inviteCode, joinedAt, lastKnownStatus };
}

async function readRegistry(): Promise<GuestGameEntry[]> {
  const raw = await AsyncStorage.getItem(GUEST_GAME_REGISTRY_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry) => {
      const normalized = toGuestGameEntry(entry);
      return normalized ? [normalized] : [];
    });
  } catch {
    return [];
  }
}

async function writeRegistry(entries: GuestGameEntry[]): Promise<void> {
  await AsyncStorage.setItem(GUEST_GAME_REGISTRY_KEY, JSON.stringify(entries));
}

export async function saveGuestToken(
  gameId: string,
  token: string,
): Promise<void> {
  await SecureStore.setItemAsync(guestTokenKey(gameId), token);
}

export async function getGuestToken(gameId: string): Promise<string | null> {
  return SecureStore.getItemAsync(guestTokenKey(gameId));
}

export async function saveGuestGame(entry: GuestGameEntry): Promise<void> {
  const entries = await readRegistry();
  const withoutCurrent = entries.filter((item) => item.gameId !== entry.gameId);

  await writeRegistry([entry, ...withoutCurrent]);
}

export async function listGuestGames(): Promise<GuestGameEntry[]> {
  const entries = await readRegistry();

  return entries.reduce<GuestGameEntry[]>((sorted, entry) => {
    const entryTime = Date.parse(entry.joinedAt);
    const index = sorted.findIndex(
      (candidate) => Date.parse(candidate.joinedAt) < entryTime,
    );

    if (index === -1) {
      return [...sorted, entry];
    }

    return [...sorted.slice(0, index), entry, ...sorted.slice(index)];
  }, []);
}

export async function removeGuestGame(gameId: string): Promise<void> {
  const entries = await readRegistry();

  await SecureStore.deleteItemAsync(guestTokenKey(gameId));
  await writeRegistry(entries.filter((entry) => entry.gameId !== gameId));
}

export async function updateGuestGameStatus(
  gameId: string,
  lastKnownStatus: string,
): Promise<void> {
  const entries = await readRegistry();
  const nextEntries = entries.map((entry) =>
    entry.gameId === gameId ? { ...entry, lastKnownStatus } : entry,
  );

  if (nextEntries.some((entry, index) => entry !== entries[index])) {
    await writeRegistry(nextEntries);
  }
}
