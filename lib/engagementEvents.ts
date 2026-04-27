/**
 * Thin façade over the engagement store. Exists so that gameplay code
 * (BuildingCard, useDailyClaim, useMintSkin, …) can fire one call and have
 * both the lifetime stats and the live daily-quest counters update without
 * the call-sites having to know which quest ids exist.
 *
 * Quest ids ALWAYS match `QUEST_DEFS` in `hooks/useDailyQuests.ts`. If you
 * add a new quest, update both places.
 */

import { useEngagementStore } from "@/store/engagementStore";

export function onBuilt(): void {
  const s = useEngagementStore.getState();
  s.recordBuild();
  s.bumpQuest("build_any", 1);
}

export function onUpgraded(): void {
  const s = useEngagementStore.getState();
  s.recordUpgrade();
  s.bumpQuest("upgrade_any", 1);
}

export function onClaimed(honeyAmount: number): void {
  const s = useEngagementStore.getState();
  s.recordClaim(honeyAmount);
  s.bumpQuest("claim_today", 1);
}

export function onLongPressedSlot(): void {
  const s = useEngagementStore.getState();
  s.bumpQuest("long_press_preview", 1);
}
