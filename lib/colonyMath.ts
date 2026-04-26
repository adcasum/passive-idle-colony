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
 * Compute pending production accumulated since `lastClaimAt`,
 * limited to MAX_OFFLINE_HOURS, but NOT yet capped by storage.
 */
export function computePending(
  state: Pick<ColonyState, "slots" | "lastClaimAt">,
  now: number,
): { hours: number; produced: Resources } {
  const elapsedMs = Math.max(0, now - state.lastClaimAt);
  const hours = Math.min(elapsedMs / 3_600_000, MAX_OFFLINE_HOURS);
  const perHour = colonyProductionPerHour(state.slots);
  return {
    hours,
    produced: {
      honey: perHour.honey * hours,
      energy: perHour.energy * hours,
      food: perHour.food * hours,
      water: perHour.water * hours,
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
