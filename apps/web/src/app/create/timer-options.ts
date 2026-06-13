/** A selectable turn-timer option (FR2). `seconds: null` means "off". */
export interface TimerOption {
  seconds: number | null;
  label: string;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * The valid turn-timer choices (FR2), matching the server's `isValidTimer`:
 *  - off
 *  - 30-second steps up to 3:00 (30, 60, …, 180)
 *  - 1-minute steps beyond, up to a sensible ceiling (240, 300, …, 600)
 */
export function timerOptions(maxSeconds = 600): TimerOption[] {
  const options: TimerOption[] = [{ seconds: null, label: 'Off' }];
  for (let s = 30; s <= 180; s += 30) {
    options.push({ seconds: s, label: formatClock(s) });
  }
  for (let s = 240; s <= maxSeconds; s += 60) {
    options.push({ seconds: s, label: formatClock(s) });
  }
  return options;
}
