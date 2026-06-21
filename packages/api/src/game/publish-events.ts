import type { LoggedEvent } from '../shared/realtime/redaction.ts';
import type { RoomRegistry } from '../shared/realtime/rooms.ts';
import type { AppendedEvent } from './state-mapping.ts';

/** Publish freshly appended DB events to the in-memory room after commit. */
export function publishAppendedEvents(
  registry: RoomRegistry,
  gameId: string,
  appended: readonly AppendedEvent[],
  version?: number,
): void {
  for (const ev of appended) {
    const event: LoggedEvent = {
      seq: ev.seq,
      type: ev.type,
      payload: ev.payload as unknown as Record<string, unknown>,
    };
    if (version !== undefined) event.version = version;
    registry.publish(gameId, event);
  }
}
