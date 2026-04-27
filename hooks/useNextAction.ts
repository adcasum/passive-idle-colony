import { useMemo } from "react";

import { BUILDINGS } from "@/constants/buildings";
import { CLAIM_COOLDOWN_HOURS } from "@/constants/buildings";
import { useColonyStore } from "@/store/colonyStore";
import type { BuildingKind, Slot } from "@/types";

const MS_PER_HOUR = 3_600_000;
const STORAGE_WARN_RATIO = 0.85;

export type NextActionKey =
  | "first_hive"
  | "solar"
  | "food"
  | "water"
  | "claim"
  | "storage_full"
  | "upgrade"
  | "idle";

export interface NextAction {
  /** i18n key used to render the suggestion. Always under `home.next_action_*`. */
  key: NextActionKey;
  /** Optional interpolation values. */
  values?: Record<string, string | number>;
  /** Suggested deep-link inside the app — what tapping the card should do. */
  href: "/colony" | "/rewards" | "/mint" | null;
}

function hasKind(slots: readonly Slot[], kind: BuildingKind): boolean {
  return slots.some((s) => s !== null && s.kind === kind);
}

function lowestUpgradableSlot(
  slots: readonly Slot[],
): { slot: NonNullable<Slot>; idx: number } | null {
  let best: { slot: NonNullable<Slot>; idx: number } | null = null;
  slots.forEach((s, i) => {
    if (!s) return;
    const def = BUILDINGS[s.kind];
    if (s.level >= def.maxLevel) return;
    if (!best || s.level < best.slot.level) {
      best = { slot: s, idx: i };
    }
  });
  return best;
}

/**
 * Pick the single most useful "what's next" suggestion for the player.
 * Strict priority order:
 *
 *  1. No buildings yet            → place first hive
 *  2. Hive without solar          → add solar panel
 *  3. Hive without food           → add small farm
 *  4. Hive without water          → add water collector
 *  5. Claim is ready              → claim
 *  6. Storage ≥ 85% full          → claim or build storage
 *  7. Lowest-level building       → upgrade it
 *  8. Otherwise                   → idle (wait for next cycle)
 */
export function useNextAction(): NextAction {
  const slots = useColonyStore((s) => s.slots);
  const resources = useColonyStore((s) => s.resources);
  const lastClaimAt = useColonyStore((s) => s.lastClaimAt);
  const storageCap = useColonyStore((s) =>
    s.slots.reduce((cap, slot) => {
      if (!slot) return cap;
      const def = BUILDINGS[slot.kind];
      const bonus = def.storageBonusPerLevel ?? 0;
      return cap + bonus * slot.level;
    }, 200),
  );

  return useMemo<NextAction>(() => {
    const placed = slots.filter((s) => s !== null) as NonNullable<Slot>[];

    // 1. No buildings at all — first quest is to place a hive.
    if (placed.length === 0) {
      return { key: "first_hive", href: "/colony" };
    }

    // 2-4. Hive without supporting infrastructure.
    const hasHive = hasKind(slots, "bee_hive");
    if (hasHive) {
      if (!hasKind(slots, "solar_panel")) {
        return { key: "solar", href: "/colony" };
      }
      if (!hasKind(slots, "small_farm")) {
        return { key: "food", href: "/colony" };
      }
      if (!hasKind(slots, "water_collector")) {
        return { key: "water", href: "/colony" };
      }
    }

    // 5. Claim is ready.
    const cooldownMs = CLAIM_COOLDOWN_HOURS * MS_PER_HOUR;
    if (lastClaimAt > 0 && Date.now() - lastClaimAt >= cooldownMs) {
      return { key: "claim", href: "/colony" };
    }

    // 6. Storage near full.
    const maxStored = Math.max(
      resources.honey,
      resources.energy,
      resources.food,
      resources.water,
    );
    if (storageCap > 0 && maxStored / storageCap >= STORAGE_WARN_RATIO) {
      return { key: "storage_full", href: "/colony" };
    }

    // 7. Cheapest available upgrade.
    const target = lowestUpgradableSlot(slots);
    if (target) {
      const def = BUILDINGS[target.slot.kind];
      // We render a name token via i18n; avoid leaking English here.
      return {
        key: "upgrade",
        href: "/colony",
        values: {
          name: def.kind, // resolved to localized name in the component
          level: target.slot.level + 1,
          cost: "",
        },
      };
    }

    // 8. Nothing pressing.
    return { key: "idle", href: null };
  }, [slots, resources, lastClaimAt, storageCap]);
}
