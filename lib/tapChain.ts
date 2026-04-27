/**
 * Tap-chain combo — short-window multi-slot tap encourages "play with
 * the screen" rather than hunting one tile per cooldown.
 *
 * State is a tiny module-scoped singleton (not React state): the chain
 * lives across the whole grid, including being read inside Reanimated
 * worklets. Slots call `recordTap(slotIndex)` on a tap-to-tend; this
 * returns the multiplier that applies to *that* tap.
 *
 * Rules (designed to be hard to "farm" but easy to feel):
 *   - A tap counts toward the chain if it's a different slot than the
 *     previous tap AND is within `WINDOW_MS` of the previous tap.
 *   - Chain length 1 / 2 -> multiplier ×1 (no bonus).
 *   - Chain length 3 / 4 -> ×1.5.
 *   - Chain length ≥5    -> ×2 (capped).
 *   - Re-tapping the same slot resets the streak (you actually have to
 *     move around).
 *
 * The cap intentionally matches the mini-event multiplier (×3 with no
 * stacking) so the maximum sustained boost when tend + chain + mini
 * align is ×3 (mini wins; chain is *or*-merged, not multiplied — see
 * useTapToTend).
 */

const WINDOW_MS = 2_000;

export interface ChainResult {
  multiplier: number;
  /** Length of chain after THIS tap is recorded (1, 2, 3, ...). */
  length: number;
  /** True if this tap broke / reset the streak (same slot, or window expired). */
  reset: boolean;
}

let lastSlot: number | null = null;
let lastAt = 0;
let chainLength = 0;

export function recordTap(slotIndex: number, now: number = Date.now()): ChainResult {
  const elapsed = now - lastAt;
  const sameSlot = lastSlot === slotIndex;

  if (lastSlot === null || sameSlot || elapsed > WINDOW_MS) {
    // Capture "did we break an active streak" BEFORE we mutate
    // `lastSlot` below, otherwise the read of `lastSlot` afterwards is
    // always non-null and `reset` would never reflect a window-expiry
    // break (only same-slot taps).
    const wasReset = lastSlot !== null && (sameSlot || elapsed > WINDOW_MS);
    chainLength = 1;
    lastSlot = slotIndex;
    lastAt = now;
    return {
      multiplier: 1,
      length: 1,
      reset: wasReset,
    };
  }

  chainLength += 1;
  lastSlot = slotIndex;
  lastAt = now;

  let multiplier = 1;
  if (chainLength >= 5) multiplier = 2;
  else if (chainLength >= 3) multiplier = 1.5;

  return { multiplier, length: chainLength, reset: false };
}

/** Reset chain state (e.g. on screen blur or wallet disconnect). */
export function resetChain(): void {
  lastSlot = null;
  lastAt = 0;
  chainLength = 0;
}

/** Read-only view, used by tests. */
export function _peekChain() {
  return { lastSlot, lastAt, chainLength };
}
