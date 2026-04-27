/**
 * "Spring Bloom" — a deterministic, server-less production-multiplier event.
 *
 * Goal: a recurring "come back this week" pull that doesn't require a
 * server, push notifications, or per-user state. Every player on every
 * device sees the same bloom window because it's purely a function of
 * UTC date.
 *
 * Schedule: every 5 days, the bloom window opens at **05:00 UTC** and
 * lasts 24 hours. Production is multiplied by `BLOOM_MULTIPLIER` while
 * the window is active.
 *
 * 5 days is short enough that a player who plays once a week will hit
 * one bloom on average; long enough that it doesn't feel constant.
 */

const EPOCH_DAY_INDEX = 19_723; // 2024-01-01 UTC, baseline for the modulo cycle.
const CYCLE_DAYS = 5;
const WINDOW_HOURS = 24;
const WINDOW_START_HOUR_UTC = 5;

export const BLOOM_MULTIPLIER = 1.5;

interface DayBoundary {
  /** UTC milliseconds at the start of the day's bloom window. */
  startMs: number;
  /** UTC milliseconds at the end of the day's bloom window. */
  endMs: number;
}

function dayIndexUtc(ms: number): number {
  return Math.floor(ms / 86_400_000);
}

function bloomWindowForCycleStart(cycleStartDay: number): DayBoundary {
  const startMs = cycleStartDay * 86_400_000 + WINDOW_START_HOUR_UTC * 3_600_000;
  const endMs = startMs + WINDOW_HOURS * 3_600_000;
  return { startMs, endMs };
}

/**
 * Returns the **current or next** bloom window for a given moment in
 * time. If `now` falls inside an active window, `active` is true and
 * `endMs` is when it closes; otherwise `active` is false and `startMs`
 * is when the next window opens.
 */
export function bloomStatus(now: number = Date.now()): {
  active: boolean;
  startMs: number;
  endMs: number;
  multiplier: number;
} {
  const today = dayIndexUtc(now);
  // Find the most recent cycle-start day on/before today.
  const offsetIntoCycle = ((today - EPOCH_DAY_INDEX) % CYCLE_DAYS + CYCLE_DAYS) % CYCLE_DAYS;
  const lastCycleStart = today - offsetIntoCycle;

  const lastWindow = bloomWindowForCycleStart(lastCycleStart);
  if (now >= lastWindow.startMs && now < lastWindow.endMs) {
    return {
      active: true,
      startMs: lastWindow.startMs,
      endMs: lastWindow.endMs,
      multiplier: BLOOM_MULTIPLIER,
    };
  }

  const nextWindow =
    now < lastWindow.startMs
      ? lastWindow
      : bloomWindowForCycleStart(lastCycleStart + CYCLE_DAYS);

  return {
    active: false,
    startMs: nextWindow.startMs,
    endMs: nextWindow.endMs,
    multiplier: 1,
  };
}

/**
 * Convenience wrapper: returns the multiplier to apply to current
 * production. 1.0 outside the window, BLOOM_MULTIPLIER inside.
 */
export function bloomMultiplier(now: number = Date.now()): number {
  return bloomStatus(now).active ? BLOOM_MULTIPLIER : 1;
}
