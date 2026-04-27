/**
 * Queen Voice — contextual flavor lines surfaced as a small bubble on the
 * Home hero. Pure logic; the React surface lives in
 * `components/Home/QueenVoice.tsx`.
 *
 * The Queen comments on the colony's *current* situation: "soft" status
 * (idle / low resource / Bloom incoming), not on transient events. She
 * never speaks twice in a row about the same thing within a 90-second
 * window — repetition shatters the illusion.
 */

import { bloomStatus } from "@/lib/bloomEvent";

import type { ResourceKind, Resources } from "@/types";

/**
 * Context that drives line selection. Order in this array is *priority*:
 * if multiple contexts apply, the earlier one wins. So "first_build" and
 * "claim_ready" beat low-resource warnings, which beat idle banter.
 */
export const QUEEN_CONTEXTS = [
  "first_build",
  "bloom_active",
  "near_bloom",
  "claim_ready",
  "low_water",
  "low_food",
  "low_energy",
  "low_honey",
  "near_full",
  "idle",
] as const;

export type QueenContext = (typeof QUEEN_CONTEXTS)[number];

interface ContextInput {
  /** Number of buildings placed (slots filtered for non-null). */
  builtCount: number;
  /** Per-resource "headroom ratio": value / cap. 0 = empty, 1 = full. */
  fillRatio: Record<ResourceKind, number>;
  /** Hours of pending production not yet claimed. */
  pendingHours: number;
  /** Any resource at >=80% of cap. */
  storageNearFull: boolean;
  /** Hours until next bloom (negative if bloom currently active). */
  hoursUntilBloom: number;
  /** Bloom currently active. */
  bloomActive: boolean;
  /** Claim is off cooldown. */
  claimReady: boolean;
}

export function inferContext(input: ContextInput): QueenContext {
  if (input.builtCount === 0) return "first_build";
  if (input.bloomActive) return "bloom_active";
  if (input.hoursUntilBloom > 0 && input.hoursUntilBloom <= 6) return "near_bloom";
  if (input.claimReady && input.pendingHours >= 4) return "claim_ready";
  if (input.fillRatio.water <= 0.2) return "low_water";
  if (input.fillRatio.food <= 0.2) return "low_food";
  if (input.fillRatio.energy <= 0.2) return "low_energy";
  if (input.fillRatio.honey <= 0.2) return "low_honey";
  if (input.storageNearFull) return "near_full";
  return "idle";
}

export interface QueenLine {
  /** i18n key (e.g. "queen.idle.3"). */
  key: string;
  /** Stable identifier across renders (context + index). */
  id: string;
  context: QueenContext;
}

/**
 * How many lines exist per context. Must match the `queen.<ctx>.<n>` keys
 * in every locale file.
 */
const LINES_PER_CONTEXT: Record<QueenContext, number> = {
  first_build: 4,
  bloom_active: 5,
  near_bloom: 4,
  claim_ready: 5,
  low_water: 4,
  low_food: 4,
  low_energy: 4,
  low_honey: 4,
  near_full: 4,
  idle: 8,
};

/**
 * Pick a line for the given context. We rotate within the context's pool
 * with a coarse time bucket (every `rotationMs` the index advances by 1)
 * so a player who keeps the app open sees variety, but a quick close-
 * and-reopen doesn't snap to a different line on every tap.
 */
export function pickLine(
  context: QueenContext,
  now: number = Date.now(),
  rotationMs: number = 90_000,
): QueenLine {
  const total = LINES_PER_CONTEXT[context];
  // Mix in a 32-bit hash of the context so different contexts don't all
  // resolve to the same numeric index.
  const seed = hashString(context);
  const bucket = Math.floor(now / rotationMs);
  const idx = ((bucket + seed) % total + total) % total;
  return {
    key: `queen.${context}.${idx + 1}`,
    id: `${context}:${idx}`,
    context,
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * High-level convenience used by the React component — single call,
 * single source of truth for "what should the Queen be saying right
 * now". Stateless: no React, no timers.
 */
export function currentQueenLine(args: {
  resources: Resources;
  storageCap: number;
  builtCount: number;
  pendingHours: number;
  claimReady: boolean;
  now?: number;
  rotationMs?: number;
}): QueenLine {
  const now = args.now ?? Date.now();
  const cap = Math.max(1, args.storageCap);
  const fillRatio: Record<ResourceKind, number> = {
    honey: clamp01(args.resources.honey / cap),
    energy: clamp01(args.resources.energy / cap),
    food: clamp01(args.resources.food / cap),
    water: clamp01(args.resources.water / cap),
  };
  const storageNearFull = (Object.values(fillRatio) as number[]).some(
    (r) => r >= 0.8,
  );
  const status = bloomStatus(now);
  const hoursUntilBloom = status.active ? -1 : (status.startMs - now) / 3_600_000;
  const ctx = inferContext({
    builtCount: args.builtCount,
    fillRatio,
    pendingHours: args.pendingHours,
    storageNearFull,
    hoursUntilBloom,
    bloomActive: status.active,
    claimReady: args.claimReady,
  });
  return pickLine(ctx, now, args.rotationMs);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
