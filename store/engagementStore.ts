import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Engagement store: login streak + daily quest progress.
 *
 * Quests reset at the player's local 04:00 to avoid the "midnight reset
 * trap" where players who play late accidentally lose progress. The reset
 * window is computed in `hooks/useDailyQuests.ts`.
 *
 * Streak rules (kept simple — anti-cheat handled by trusting local clock
 * for MVP; can be moved server-side later):
 *  - First login of a new local day → streak += 1.
 *  - If the gap between this login and the last login crosses more than
 *    1 calendar day, streak resets to 1.
 *  - We snapshot `lastLoginDay` as a `YYYY-MM-DD` string (local time) so
 *    multiple foregrounds within the same day don't double-count.
 */

export interface QuestProgress {
  /** True once requirements are met. Stays true until quest day rolls over. */
  completed: boolean;
  /** Counter for progress-bar UI (0..target). */
  progress: number;
  /** Optional flag for one-shot quests (e.g. "claim today"). */
  rewardClaimed: boolean;
}

export interface EngagementStore {
  /** Current consecutive-day login streak (>= 0). */
  streak: number;
  /** YYYY-MM-DD of the last day we counted toward the streak. */
  lastLoginDay: string | null;
  /** Best-ever streak — purely for bragging rights / future leaderboard. */
  bestStreak: number;

  /** Date stamp used to invalidate per-day quest state. */
  questDay: string | null;
  /** Current day's quest progress, keyed by quest id. */
  quests: Record<string, QuestProgress>;

  /**
   * Cache of one-shot toasts that were already shown today, so we don't
   * re-fire them on every refresh (e.g. storage-warn / starvation).
   */
  shownToasts: string[];

  /** Persisted lifetime claim counter for level-XP math. */
  claimsMade: number;
  /** Persisted lifetime honey claimed (post-cap). */
  lifetimeHoneyClaimed: number;
  /** Persisted lifetime building-build counter. */
  buildingsBuilt: number;
  /** Persisted lifetime upgrade counter. */
  upgradesDone: number;

  // Mutations
  recordLogin: (todayLocal: string) => void;
  setQuestState: (
    todayLocal: string,
    quests: Record<string, QuestProgress>,
  ) => void;
  bumpQuest: (id: string, by?: number) => void;
  markQuestComplete: (id: string) => void;
  noteToastShown: (id: string) => void;
  resetShownToastsForNewDay: (todayLocal: string) => void;
  recordClaim: (honey: number) => void;
  recordBuild: () => void;
  recordUpgrade: () => void;
  reset: () => void;
}

const initialState: Omit<
  EngagementStore,
  | "recordLogin"
  | "setQuestState"
  | "bumpQuest"
  | "markQuestComplete"
  | "noteToastShown"
  | "resetShownToastsForNewDay"
  | "recordClaim"
  | "recordBuild"
  | "recordUpgrade"
  | "reset"
> = {
  streak: 0,
  lastLoginDay: null,
  bestStreak: 0,
  questDay: null,
  quests: {},
  shownToasts: [],
  claimsMade: 0,
  lifetimeHoneyClaimed: 0,
  buildingsBuilt: 0,
  upgradesDone: 0,
};

/** Day-difference between two YYYY-MM-DD local strings. */
function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export const useEngagementStore = create<EngagementStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      recordLogin: (todayLocal) => {
        const last = get().lastLoginDay;
        if (last === todayLocal) return; // already counted today
        let nextStreak = 1;
        if (last) {
          const gap = daysBetween(last, todayLocal);
          if (gap === 1) nextStreak = get().streak + 1;
          else if (gap === 0) nextStreak = Math.max(1, get().streak);
          // gap > 1 → streak broke, reset to 1
        }
        set({
          streak: nextStreak,
          lastLoginDay: todayLocal,
          bestStreak: Math.max(get().bestStreak, nextStreak),
        });
      },

      setQuestState: (todayLocal, quests) => {
        set({ questDay: todayLocal, quests });
      },

      bumpQuest: (id, by = 1) => {
        const cur = get().quests[id];
        if (!cur || cur.completed) return;
        set({
          quests: {
            ...get().quests,
            [id]: { ...cur, progress: cur.progress + by },
          },
        });
      },

      markQuestComplete: (id) => {
        const cur = get().quests[id];
        // Defense-in-depth: refuse to flag a fresh quest (progress=0) as
        // completed. Without this, a stale-closure read from a hook that
        // sees yesterday's progress could mark today's freshly-rolled
        // quest as Done with a 0% progress bar. Quest targets are always
        // >= 1 in QUEST_DEFS, so requiring strictly positive progress is
        // safe and never blocks legitimate completions.
        if (!cur || cur.progress <= 0) return;
        set({
          quests: {
            ...get().quests,
            [id]: { ...cur, completed: true, rewardClaimed: cur.rewardClaimed },
          },
        });
      },

      noteToastShown: (id) => {
        if (get().shownToasts.includes(id)) return;
        set({ shownToasts: [...get().shownToasts, id] });
      },

      resetShownToastsForNewDay: (todayLocal) => {
        if (get().questDay !== todayLocal) {
          set({ shownToasts: [] });
        }
      },

      recordClaim: (honey) => {
        set({
          claimsMade: get().claimsMade + 1,
          lifetimeHoneyClaimed: get().lifetimeHoneyClaimed + Math.max(0, honey),
        });
      },

      recordBuild: () => set({ buildingsBuilt: get().buildingsBuilt + 1 }),
      recordUpgrade: () => set({ upgradesDone: get().upgradesDone + 1 }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: "passive-idle-colony:engagement:v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
