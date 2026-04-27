/**
 * Colony level / XP math.
 *
 * Level is a soft progression layer on top of the raw resources — it gives
 * the player a single visible number that goes up over time (claims +
 * buildings + upgrades). XP is virtual: never persisted directly, always
 * derived from store state so it can never drift.
 */

import type { Slot } from "@/types";

export interface ColonyLevelInfo {
  level: number;
  /** Total accumulated XP across the colony's lifetime. */
  xp: number;
  /** XP at the start of the current level. */
  levelStartXp: number;
  /** XP needed to reach the next level. */
  nextLevelXp: number;
  /** Pretty progress fraction, 0..1, within the current level. */
  progress: number;
  /** True once the player reaches the soft-end (Royal Court). */
  isMax: boolean;
  /** Tier label key for i18n (`home.colony_tier_*`). */
  tierKey: "home.colony_tier_worker" | "home.colony_tier_artisan" | "home.colony_tier_royal";
}

/** Soft end-game ceiling. Shown as "Royal Court" in copy. */
const MAX_LEVEL = 30;

/**
 * XP curve: gentle near the start to reward first 30 minutes of play, then
 * steepens. Inverse of `xpForLevel(L)` is roughly L = floor(sqrt(xp/15)).
 */
function xpForLevel(level: number): number {
  // L=1 → 0, L=2 → 60, L=3 → 240, L=10 → 2700, L=30 → 24300.
  const l = Math.max(1, level);
  return 30 * (l - 1) * l;
}

function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  // Solve 30 * (L-1) * L <= xp  →  L <= 0.5 + sqrt(0.25 + xp/30)
  const L = Math.floor(0.5 + Math.sqrt(0.25 + xp / 30));
  return Math.min(MAX_LEVEL, Math.max(1, L));
}

/**
 * Compute total XP from durable colony state. Pure of any time-of-day
 * fluctuation so the XP never goes down.
 */
export function colonyXp(opts: {
  slots: readonly Slot[];
  claimsMade: number;
  lifetimeHoneyClaimed: number;
}): number {
  let xp = 0;
  // Each placed building grants 25 XP, plus 15 per level above 1.
  for (const slot of opts.slots) {
    if (!slot) continue;
    xp += 25 + Math.max(0, slot.level - 1) * 15;
    if (slot.skinMint) xp += 50;
  }
  // Each claim is worth 10 XP — encourages logging in daily.
  xp += opts.claimsMade * 10;
  // Lifetime honey is a slow long-tail accelerator — keeps the bar moving
  // even after you've maxed out buildings.
  xp += Math.floor(opts.lifetimeHoneyClaimed / 50);
  return xp;
}

export function colonyLevelInfo(xp: number): ColonyLevelInfo {
  const level = levelForXp(xp);
  const isMax = level >= MAX_LEVEL;
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = isMax
    ? 1
    : Math.min(
        1,
        Math.max(0, (xp - levelStartXp) / Math.max(1, nextLevelXp - levelStartXp)),
      );
  const tierKey: ColonyLevelInfo["tierKey"] =
    level >= 20
      ? "home.colony_tier_royal"
      : level >= 10
        ? "home.colony_tier_artisan"
        : "home.colony_tier_worker";
  return {
    level,
    xp,
    levelStartXp,
    nextLevelXp,
    progress,
    isMax,
    tierKey,
  };
}

export const COLONY_MAX_LEVEL = MAX_LEVEL;
