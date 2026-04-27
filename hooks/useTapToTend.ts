import { useCallback } from "react";

import { buildingProductionPerHour, maxStorage } from "@/lib/colonyMath";
import { useColonyStore } from "@/store/colonyStore";
import { useEngagementStore } from "@/store/engagementStore";
import type { ResourceKind } from "@/types";

/**
 * "Tend" interaction — tapping a built tile gives a small instant
 * resource boost. Goal: a sub-minute interaction loop so the game has
 * something to do in the gaps between 8h claims and weekly Bloom events.
 *
 * Math: each tend grants TEND_FRACTION of one hour of that building's
 * primary-resource production. With TEND_FRACTION=0.05 and a 5-minute
 * cooldown, the maximum theoretical extra yield is +60% per hour of
 * that resource — capped by storage, so it can't break the idle economy
 * long-term but rewards an active player meaningfully.
 */
export const TEND_COOLDOWN_MS = 5 * 60 * 1000;
export const TEND_FRACTION = 0.05;

export interface TendResult {
  granted: number;
  resource: ResourceKind;
  cappedOut: boolean;
}

export function useTapToTend(slotIndex: number) {
  const slot = useColonyStore((s) => s.slots[slotIndex]);
  const tendCooldowns = useEngagementStore((s) => s.tendCooldowns);
  const recordTend = useEngagementStore((s) => s.recordTend);

  const lastTendAt = tendCooldowns[slotIndex] ?? 0;
  const elapsed = Date.now() - lastTendAt;
  const msUntilNext = Math.max(0, TEND_COOLDOWN_MS - elapsed);
  const canTend = !!slot && msUntilNext === 0;

  const prod = slot
    ? buildingProductionPerHour(slot)
    : { resource: null as ResourceKind | null, amount: 0 };
  const bumpAmount = prod.amount * TEND_FRACTION;

  const tend = useCallback((): TendResult | null => {
    const colony = useColonyStore.getState();
    const currentSlot = colony.slots[slotIndex];
    if (!currentSlot) return null;

    const now = Date.now();
    const lastAt = useEngagementStore.getState().tendCooldowns[slotIndex] ?? 0;
    if (now - lastAt < TEND_COOLDOWN_MS) return null;

    const { resource, amount } = buildingProductionPerHour(currentSlot);
    if (!resource || amount <= 0) return null;

    const cap = maxStorage(colony.slots);
    const currentValue = colony.resources[resource];
    const desired = amount * TEND_FRACTION;
    const granted = Math.min(desired, Math.max(0, cap - currentValue));

    recordTend(slotIndex, now);

    if (granted <= 0) {
      // Resource at cap. Still consume the cooldown so player gets a
      // clear "cap reached" toast and doesn't keep tapping mindlessly.
      return { granted: 0, resource, cappedOut: true };
    }

    useColonyStore.setState({
      resources: { ...colony.resources, [resource]: currentValue + granted },
    });
    return { granted, resource, cappedOut: false };
  }, [slotIndex, recordTend]);

  return {
    canTend,
    msUntilNext,
    bumpAmount,
    bumpResource: prod.resource,
    tend,
  };
}
