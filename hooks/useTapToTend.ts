import { useCallback } from "react";

import { buildingProductionPerHour, maxStorage } from "@/lib/colonyMath";
import { miniEventStatus } from "@/lib/miniEvent";
import { recordTap } from "@/lib/tapChain";
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
  /** Final multiplier applied (chain × mini-event), 1 if neither matched. */
  multiplier: number;
  /** Source(s) of the multiplier, in the order they applied. */
  sources: ("chain" | "mini")[];
  /** Chain length at the moment of this tap, 1 if reset. */
  chainLength: number;
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

    // Stack chain × mini-event multiplicatively. Chain rewards rapid
    // multi-tile tapping (×1 / ×1.5 / ×2). Mini-event is a single-slot
    // 10-min spotlight (×3). A player who happens to chain *into* the
    // spotlight gets the full ×6 stack — rare but earned.
    const chain = recordTap(slotIndex, now);
    const occupied = colony.slots
      .map((s, i) => (s ? i : -1))
      .filter((i) => i >= 0);
    const event = miniEventStatus(now, occupied);
    const eventBoost =
      event.active && event.targetSlot === slotIndex ? event.multiplier : 1;
    const multiplier = chain.multiplier * eventBoost;
    const sources: ("chain" | "mini")[] = [];
    if (chain.multiplier > 1) sources.push("chain");
    if (eventBoost > 1) sources.push("mini");

    const cap = maxStorage(colony.slots);
    const currentValue = colony.resources[resource];
    const desired = amount * TEND_FRACTION * multiplier;
    const granted = Math.min(desired, Math.max(0, cap - currentValue));

    recordTend(slotIndex, now);

    if (granted <= 0) {
      // Resource at cap. Still consume the cooldown so player gets a
      // clear "cap reached" toast and doesn't keep tapping mindlessly.
      return {
        granted: 0,
        resource,
        cappedOut: true,
        multiplier,
        sources,
        chainLength: chain.length,
      };
    }

    useColonyStore.setState({
      resources: { ...colony.resources, [resource]: currentValue + granted },
    });
    return {
      granted,
      resource,
      cappedOut: false,
      multiplier,
      sources,
      chainLength: chain.length,
    };
  }, [slotIndex, recordTend]);

  return {
    canTend,
    msUntilNext,
    bumpAmount,
    bumpResource: prod.resource,
    tend,
  };
}
