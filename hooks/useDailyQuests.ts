import { useEffect, useMemo } from "react";

import { useEngagementStore, type QuestProgress } from "@/store/engagementStore";

/**
 * Daily quest definitions. Kept TINY on purpose — the goal is to give the
 * player one obvious "thing to do today" that doesn't take more than 2
 * minutes. Quest reward payout is currently virtual (just XP via login),
 * but the hook exposes a `reward` field so we can wire honey rewards
 * later without changing the data shape.
 *
 * Quest ids must stay stable — they're persisted in AsyncStorage.
 */
export interface QuestDef {
  id: string;
  /** i18n key for the quest's title (under `quests.*`). */
  titleKey: string;
  /** Number of times the underlying event must fire before completion. */
  target: number;
  /** Honey reward shown in the UI (cosmetic for now). */
  reward: number;
}

export const QUEST_DEFS: readonly QuestDef[] = [
  { id: "build_any", titleKey: "quests.build_any", target: 1, reward: 50 },
  { id: "upgrade_any", titleKey: "quests.upgrade_any", target: 1, reward: 30 },
  { id: "claim_today", titleKey: "quests.claim_today", target: 1, reward: 20 },
  {
    id: "long_press_preview",
    titleKey: "quests.long_press_preview",
    target: 1,
    reward: 10,
  },
];

/**
 * "Today" boundary for quests: we treat the day as flipping at the player's
 * **local 04:00**. A player who finishes a session at 23:59 and reopens the
 * app at 00:30 should still see the same quest set — they only roll over
 * after 04:00 the next morning.
 */
function localQuestDay(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - 4 * 3_600_000);
  const y = shifted.getFullYear();
  const m = (shifted.getMonth() + 1).toString().padStart(2, "0");
  const d = shifted.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextResetTimestamp(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(4, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

function blankProgress(): QuestProgress {
  return { completed: false, progress: 0, rewardClaimed: false };
}

export interface UiQuest {
  def: QuestDef;
  state: QuestProgress;
}

export function useDailyQuests() {
  const questDay = useEngagementStore((s) => s.questDay);
  const quests = useEngagementStore((s) => s.quests);
  const setQuestState = useEngagementStore((s) => s.setQuestState);
  const markQuestComplete = useEngagementStore((s) => s.markQuestComplete);
  const resetShownToastsForNewDay = useEngagementStore(
    (s) => s.resetShownToastsForNewDay,
  );

  // Roll the quest state over to today on mount. Persisted state survives
  // restarts, so this no-ops on subsequent mounts on the same day.
  useEffect(() => {
    const today = localQuestDay();
    if (questDay !== today) {
      const fresh: Record<string, QuestProgress> = {};
      for (const def of QUEST_DEFS) fresh[def.id] = blankProgress();
      // Order matters: `setQuestState` synchronously bumps `questDay` to
      // `today`, which would defeat `resetShownToastsForNewDay`'s own
      // `questDay !== today` guard. Clear day-scoped toasts FIRST.
      resetShownToastsForNewDay(today);
      setQuestState(today, fresh);
    }
  }, [questDay, setQuestState, resetShownToastsForNewDay]);

  // Auto-flip completed=true once progress reaches target.
  useEffect(() => {
    for (const def of QUEST_DEFS) {
      const cur = quests[def.id];
      if (cur && !cur.completed && cur.progress >= def.target) {
        markQuestComplete(def.id);
      }
    }
  }, [quests, markQuestComplete]);

  const ui: UiQuest[] = useMemo(
    () =>
      QUEST_DEFS.map((def) => ({
        def,
        state: quests[def.id] ?? blankProgress(),
      })),
    [quests],
  );

  const completedCount = ui.filter((q) => q.state.completed).length;

  return {
    quests: ui,
    completedCount,
    total: ui.length,
    allDone: completedCount === ui.length && ui.length > 0,
    nextResetMs: nextResetTimestamp() - Date.now(),
  };
}

/** Exposed for unit tests and `useNextAction`. */
export const _internals = { localQuestDay, nextResetTimestamp };
