import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { DailyClaimResult, Resources } from "@/types";

interface ClaimRecord {
  at: number;
  hours: number;
  produced: Resources;
  cappedAt: Resources;
}

interface RewardsStore {
  history: ClaimRecord[];
  totalClaimed: Resources;
  lastClaimAt: number | null;
  recordClaim: (r: DailyClaimResult) => void;
  reset: () => void;
}

const ZERO: Resources = { honey: 0, energy: 0, food: 0, water: 0 };

export const useRewardsStore = create<RewardsStore>()(
  persist(
    (set, get) => ({
      history: [],
      totalClaimed: { ...ZERO },
      lastClaimAt: null,
      recordClaim: (r) => {
        const now = Date.now();
        const total = get().totalClaimed;
        set({
          lastClaimAt: now,
          totalClaimed: {
            honey: total.honey + r.cappedAt.honey,
            energy: total.energy + r.cappedAt.energy,
            food: total.food + r.cappedAt.food,
            water: total.water + r.cappedAt.water,
          },
          history: [
            { at: now, hours: r.hours, produced: r.produced, cappedAt: r.cappedAt },
            ...get().history,
          ].slice(0, 30),
        });
      },
      reset: () =>
        set({ history: [], totalClaimed: { ...ZERO }, lastClaimAt: null }),
    }),
    {
      name: "passive-idle-colony:rewards:v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
