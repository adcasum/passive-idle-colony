import {
  BASE_RESOURCE_CAP,
  BUILDINGS,
  MAX_OFFLINE_HOURS,
} from "@/constants/buildings";
import type {
  Building,
  ColonyState,
  DailyClaimResult,
  ResourceKind,
  Resources,
  Slot,
} from "@/types";

const ZERO_RESOURCES: Resources = { honey: 0, energy: 0, food: 0, water: 0 };

export function emptyResources(): Resources {
  return { ...ZERO_RESOURCES };
}

export function addResources(a: Resources, b: Resources): Resources {
  return {
    honey: a.honey + b.honey,
    energy: a.energy + b.energy,
    food: a.food + b.food,
    water: a.water + b.water,
  };
}

export function subResources(a: Resources, b: Resources): Resources {
  return {
    honey: a.honey - b.honey,
    energy: a.energy - b.energy,
    food: a.food - b.food,
    water: a.water - b.water,
  };
}

export function canAfford(have: Resources, cost: Partial<Resources>): boolean {
  return (
    have.honey >= (cost.honey ?? 0) &&
    have.energy >= (cost.energy ?? 0) &&
    have.food >= (cost.food ?? 0) &&
    have.water >= (cost.water ?? 0)
  );
}

/** Cost to upgrade from `currentLevel` -> `currentLevel + 1`. */
export function upgradeCost(
  kind: Building["kind"],
  currentLevel: number,
): Resources {
  const def = BUILDINGS[kind];
  const factor = Math.pow(def.costMultiplier, currentLevel);
  const out = emptyResources();
  (Object.keys(def.baseCost) as ResourceKind[]).forEach((k) => {
    out[k] = Math.ceil((def.baseCost[k] ?? 0) * factor);
  });
  return out;
}

/** Production for one building at its current level (per hour, before global modifiers). */
export function buildingProductionPerHour(b: Building): {
  resource: ResourceKind | null;
  amount: number;
} {
  const def = BUILDINGS[b.kind];
  if (!def.produces) return { resource: null, amount: 0 };
  const base =
    def.baseProductionPerHour * Math.pow(def.levelMultiplier, b.level - 1);
  const skinMul = b.skinMint ? 1 + def.skinBonus : 1;
  return { resource: def.produces, amount: base * skinMul };
}

/** Combined research-lab boost across the colony, e.g. 0.25 = +25%. */
export function researchBoost(slots: Slot[]): number {
  let boost = 0;
  for (const s of slots) {
    if (!s) continue;
    const def = BUILDINGS[s.kind];
    if (def.researchBoostPerLevel) {
      boost += def.researchBoostPerLevel * s.level;
      if (s.skinMint) boost += def.skinBonus;
    }
  }
  return boost;
}

/** Total max storage cap (single number applied to every resource type). */
export function maxStorage(slots: Slot[]): number {
  let extra = 0;
  for (const s of slots) {
    if (!s) continue;
    const def = BUILDINGS[s.kind];
    if (def.storageBonusPerLevel) {
      extra += def.storageBonusPerLevel * s.level;
      if (s.skinMint) extra += def.storageBonusPerLevel * def.skinBonus;
    }
  }
  return BASE_RESOURCE_CAP + extra;
}

/** Sum production per hour by resource for the whole colony, applying research boost. */
export function colonyProductionPerHour(slots: Slot[]): Resources {
  const boost = 1 + researchBoost(slots);
  const out = emptyResources();
  for (const s of slots) {
    if (!s) continue;
    const { resource, amount } = buildingProductionPerHour(s);
    if (!resource) continue;
    out[resource] += amount * boost;
  }
  return out;
}

/** Cap a Resources object element-wise to a single max. */
export function capResources(r: Resources, cap: number): Resources {
  return {
    honey: Math.min(r.honey, cap),
    energy: Math.min(r.energy, cap),
    food: Math.min(r.food, cap),
    water: Math.min(r.water, cap),
  };
}

/**
 * Compute the multiplicative bloom boost averaged over the [startMs, endMs]
 * accrual window. Returns a single scalar that, when multiplied with the
 * base per-hour rate, yields the time-weighted bloom-adjusted rate.
 *
 * Implementation walks the bloom cycles overlapping the window. A 5-day
 * cycle means at most ~ceil(MAX_OFFLINE_HOURS / 120h) + 1 cycles = 2 to
 * iterate — cheap, exact, no per-tick simulation needed.
 */
function bloomBoostOverWindow(startMs: number, endMs: number): number {
  if (endMs <= startMs) return 1;
  const totalMs = endMs - startMs;

  // Walk forward from the last cycle that started on/before startMs, to the
  // first cycle that ends on/after endMs. We re-implement the schedule
  // here (rather than calling bloomStatus repeatedly) to make the math
  // explicit and testable.
  const dayIndex = (ms: number) => Math.floor(ms / 86_400_000);
  const startDay = dayIndex(startMs);
  const offsetIntoCycle =
    ((startDay - EPOCH_DAY_INDEX) % CYCLE_DAYS_FOR_BLOOM + CYCLE_DAYS_FOR_BLOOM) %
    CYCLE_DAYS_FOR_BLOOM;
  let cursorCycleStart = startDay - offsetIntoCycle;

  let boostedMs = 0;
  // Iterate cycles until we pass endMs. Bound the loop conservatively.
  for (let safety = 0; safety < 16; safety += 1) {
    const winStart =
      cursorCycleStart * 86_400_000 + WINDOW_START_HOUR_UTC_FOR_BLOOM * 3_600_000;
    const winEnd = winStart + WINDOW_HOURS_FOR_BLOOM * 3_600_000;

    if (winStart >= endMs) break;
    if (winEnd > startMs) {
      const overlapStart = Math.max(winStart, startMs);
      const overlapEnd = Math.min(winEnd, endMs);
      if (overlapEnd > overlapStart) {
        boostedMs += overlapEnd - overlapStart;
      }
    }
    cursorCycleStart += CYCLE_DAYS_FOR_BLOOM;
  }

  const baseMs = totalMs - boostedMs;
  return (baseMs + boostedMs * BLOOM_MULTIPLIER_FOR_BLOOM) / totalMs;
}

// Mirror constants from lib/bloomEvent.ts so colonyMath stays free of
// the import cycle (colonyMath is imported by Home / hooks; bloomEvent
// imports nothing from here). Kept in sync via tests.
const EPOCH_DAY_INDEX = 19_723;
const CYCLE_DAYS_FOR_BLOOM = 5;
const WINDOW_HOURS_FOR_BLOOM = 24;
const WINDOW_START_HOUR_UTC_FOR_BLOOM = 5;
const BLOOM_MULTIPLIER_FOR_BLOOM = 1.5;

/**
 * Compute pending production accumulated since `lastClaimAt`,
 * limited to MAX_OFFLINE_HOURS, but NOT yet capped by storage.
 *
 * Applies the Spring Bloom multiplier (1.5×) to the fraction of the
 * accrual window that overlapped a bloom event.
 */
export function computePending(
  state: Pick<ColonyState, "slots" | "lastClaimAt">,
  now: number,
): { hours: number; produced: Resources; bloomBoost: number } {
  const elapsedMs = Math.max(0, now - state.lastClaimAt);
  const cappedMs = Math.min(elapsedMs, MAX_OFFLINE_HOURS * 3_600_000);
  const hours = cappedMs / 3_600_000;
  const perHour = colonyProductionPerHour(state.slots);
  const startMs = now - cappedMs;
  const bloomBoost = bloomBoostOverWindow(startMs, now);
  return {
    hours,
    bloomBoost,
    produced: {
      honey: perHour.honey * hours * bloomBoost,
      energy: perHour.energy * hours * bloomBoost,
      food: perHour.food * hours * bloomBoost,
      water: perHour.water * hours * bloomBoost,
    },
  };
}

/**
 * Apply a claim: add pending production to current resources, capped by storage.
 * Returns the new state plus a result for the UI.
 */
export function applyClaim(
  state: ColonyState,
  now: number,
): { next: ColonyState; result: DailyClaimResult } {
  const { hours, produced } = computePending(state, now);
  const cap = maxStorage(state.slots);
  const merged = addResources(state.resources, produced);
  const capped = capResources(merged, cap);
  const cappedDelta: Resources = {
    honey: capped.honey - state.resources.honey,
    energy: capped.energy - state.resources.energy,
    food: capped.food - state.resources.food,
    water: capped.water - state.resources.water,
  };
  return {
    next: {
      ...state,
      resources: capped,
      lastClaimAt: now,
    },
    result: { hours, produced, cappedAt: cappedDelta },
  };
}
