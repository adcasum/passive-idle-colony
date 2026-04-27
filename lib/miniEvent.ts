/**
 * Mini-event — a 10-minute "right now" window where one random occupied
 * slot is highlighted and tapping it during the window grants a *boosted*
 * tend (×3 of the normal +5%). Adds a sub-hour engagement layer between
 * the 5-min tend cooldown and the 8-h claim.
 *
 * Like the Bloom event, this is **deterministic** (no server state, no
 * push notifications) — it is purely a function of UTC time and the
 * player's slot configuration. Two players with identical colonies
 * would see the same slot pulse at the same moment, but in practice
 * everyone's colonies differ so the experience feels personal.
 *
 * Schedule: events fire on a 45-minute grid (`startMs = floor(now / 45m) * 45m`).
 * Each grid cell is either an event window (first 10 min) or quiet
 * (remaining 35 min). The targeted slot index is derived by hashing the
 * grid cell's start time.
 */

const GRID_MS = 45 * 60 * 1000;
const ACTIVE_MS = 10 * 60 * 1000;
export const MINI_EVENT_MULTIPLIER = 3;

export interface MiniEventStatus {
  /** True if a mini-event is currently active. */
  active: boolean;
  /** Window start (ms since epoch). */
  startMs: number;
  /** Window end (active window — `startMs + 10 min`). */
  endMs: number;
  /**
   * Targeted slot index (0..8) for the active window. `null` if `active`
   * is false OR if the colony has no occupied slots — the caller should
   * skip rendering the highlight in that case.
   */
  targetSlot: number | null;
  /** Multiplier to apply to the tend bonus when this event is consumed. */
  multiplier: number;
}

const SLOT_COUNT = 9;

/**
 * Compute the current mini-event status. Caller must pass `occupiedSlots`
 * — the indices (0..8) of slots that have a building. We pick the
 * targeted slot from this set so the highlight never lands on an empty
 * tile (which would confuse the player and grant nothing).
 *
 * Stability: the target is computed by hashing the cell's start time to
 * a slot index in 0..8 and then walking forward (mod 9) until we find
 * an occupied slot. This means building a new tile *during* an active
 * window only shifts the spotlight when the new tile lands on the
 * currently-walked-over indices — a much smaller surface than the
 * naive "index into the sorted occupied list" approach, which would
 * jump the spotlight every time the player built in a slot below the
 * current target.
 */
export function miniEventStatus(
  now: number,
  occupiedSlots: number[],
): MiniEventStatus {
  const cellStart = Math.floor(now / GRID_MS) * GRID_MS;
  const inActiveWindow = now < cellStart + ACTIVE_MS;
  const startMs = cellStart;
  const endMs = cellStart + ACTIVE_MS;

  if (!inActiveWindow || occupiedSlots.length === 0) {
    return {
      active: false,
      startMs,
      endMs,
      targetSlot: null,
      multiplier: MINI_EVENT_MULTIPLIER,
    };
  }

  const occupiedSet = new Set(occupiedSlots);
  const seed = Math.floor(cellStart / GRID_MS);
  const startIdx = Math.abs(hash32(seed)) % SLOT_COUNT;
  let targetSlot: number | null = null;
  for (let step = 0; step < SLOT_COUNT; step++) {
    const candidate = (startIdx + step) % SLOT_COUNT;
    if (occupiedSet.has(candidate)) {
      targetSlot = candidate;
      break;
    }
  }
  return {
    active: true,
    startMs,
    endMs,
    targetSlot,
    multiplier: MINI_EVENT_MULTIPLIER,
  };
}

/**
 * Time until the *next* event window starts. The next start is always
 * exactly one grid cell after the current cell's start, regardless of
 * whether we're currently inside the active window or in the quiet tail.
 */
export function nextEventStartMs(now: number): number {
  const cellStart = Math.floor(now / GRID_MS) * GRID_MS;
  return cellStart + GRID_MS;
}

function hash32(n: number): number {
  let x = n | 0;
  x = (x ^ 61) ^ (x >>> 16);
  x = (x + (x << 3)) | 0;
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return x | 0;
}
