import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { BUILDINGS } from "@/constants/buildings";
import { track } from "@/lib/analytics";
import {
  applyClaim,
  canAfford,
  computePending,
  emptyResources,
  subResources,
  upgradeCost,
} from "@/lib/colonyMath";
import type {
  Building,
  BuildingKind,
  ColonyState,
  DailyClaimResult,
  Resources,
  Slot,
} from "@/types";

interface ColonyStore extends ColonyState {
  hydrated: boolean;
  /**
   * True if zustand/persist found a saved colony in AsyncStorage at startup.
   * Stays false after a fresh install / wipe even once hydration completes,
   * which lets useCloudSync know it's safe to restore from the cloud without
   * losing real local progress.
   */
  hasPersistedState: boolean;
  /** Place a new level-1 building into a slot if cost can be afforded. */
  placeBuilding: (slotIndex: number, kind: BuildingKind) => boolean;
  /** Remove a building from a slot (no refund in MVP). */
  demolish: (slotIndex: number) => void;
  /** Upgrade the building in a slot. Returns true on success. */
  upgrade: (slotIndex: number) => boolean;
  /** Set a cNFT skin mint on the building in this slot. */
  equipSkin: (slotIndex: number, mint: string) => void;
  /** Apply pending production to balances and return the result. */
  claim: () => DailyClaimResult;
  /** Compute pending production at `now` without mutating state. */
  pendingAt: (now: number) => { hours: number; produced: Resources };
  /** Reset everything (used for tests or "new colony"). */
  reset: () => void;
}

const INITIAL_SLOTS: Slot[] = Array.from({ length: 9 }, () => null);

const initialState: ColonyState = {
  slots: INITIAL_SLOTS,
  resources: { honey: 30, energy: 30, food: 30, water: 30 },
  lastClaimAt: Date.now(),
  createdAt: Date.now(),
};

let buildingCounter = 0;
function newBuildingId(): string {
  buildingCounter += 1;
  return `b_${Date.now()}_${buildingCounter}`;
}

export const useColonyStore = create<ColonyStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,
      hasPersistedState: false,

      placeBuilding: (slotIndex, kind) => {
        const state = get();
        if (slotIndex < 0 || slotIndex >= state.slots.length) return false;
        if (state.slots[slotIndex] !== null) return false;

        const def = BUILDINGS[kind];
        const cost: Resources = {
          honey: def.baseCost.honey ?? 0,
          energy: def.baseCost.energy ?? 0,
          food: def.baseCost.food ?? 0,
          water: def.baseCost.water ?? 0,
        };
        if (!canAfford(state.resources, cost)) return false;

        const next: Building = {
          id: newBuildingId(),
          kind,
          level: 1,
          skinMint: null,
        };
        const slots = state.slots.slice();
        slots[slotIndex] = next;
        set({
          slots,
          resources: subResources(state.resources, cost),
        });
        track("build", { kind, slot_index: slotIndex });
        return true;
      },

      demolish: (slotIndex) => {
        const state = get();
        if (slotIndex < 0 || slotIndex >= state.slots.length) return;
        const b = state.slots[slotIndex];
        if (b === null) return;
        const slots = state.slots.slice();
        slots[slotIndex] = null;
        set({ slots });
        track("demolish", { kind: b.kind, level: b.level });
      },

      upgrade: (slotIndex) => {
        const state = get();
        const b = state.slots[slotIndex];
        if (!b) return false;
        const def = BUILDINGS[b.kind];
        if (b.level >= def.maxLevel) return false;
        const cost = upgradeCost(b.kind, b.level);
        if (!canAfford(state.resources, cost)) return false;
        const slots = state.slots.slice();
        slots[slotIndex] = { ...b, level: b.level + 1 };
        set({
          slots,
          resources: subResources(state.resources, cost),
        });
        track("upgrade", { kind: b.kind, new_level: b.level + 1 });
        return true;
      },

      equipSkin: (slotIndex, mint) => {
        const state = get();
        const b = state.slots[slotIndex];
        if (!b) return;
        const slots = state.slots.slice();
        slots[slotIndex] = { ...b, skinMint: mint };
        set({ slots });
      },

      claim: () => {
        const state = get();
        const { next, result } = applyClaim(state, Date.now());
        set({
          slots: next.slots,
          resources: next.resources,
          lastClaimAt: next.lastClaimAt,
        });
        track("claim", {
          hours: result.hours,
          honey: result.cappedAt.honey,
          energy: result.cappedAt.energy,
          food: result.cappedAt.food,
          water: result.cappedAt.water,
        });
        return result;
      },

      pendingAt: (now) =>
        computePending(
          { slots: get().slots, lastClaimAt: get().lastClaimAt },
          now,
        ),

      reset: () => {
        set({ ...initialState, hydrated: true, hasPersistedState: false });
        track("colony_reset");
      },
    }),
    {
      name: "passive-idle-colony:v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        slots: state.slots,
        resources: state.resources,
        lastClaimAt: state.lastClaimAt,
        createdAt: state.createdAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mark hydrated on next tick. `hasPersistedState` was set true by
          // the merge fn below when a real saved blob was found.
          setTimeout(() => useColonyStore.setState({ hydrated: true }), 0);
        } else {
          useColonyStore.setState({
            hydrated: true,
            hasPersistedState: false,
          });
        }
      },
      merge: (persisted, current) => {
        const p = (persisted as Partial<ColonyState>) || {};
        const hasPersistedState =
          !!persisted &&
          (p.slots !== undefined ||
            p.resources !== undefined ||
            p.lastClaimAt !== undefined);
        return {
          ...current,
          ...p,
          slots: p.slots ?? current.slots,
          resources: p.resources ?? current.resources,
          lastClaimAt: p.lastClaimAt ?? current.lastClaimAt,
          createdAt: p.createdAt ?? current.createdAt,
          hasPersistedState,
        };
      },
    },
  ),
);

/** Useful for unit tests. */
export const __INTERNAL = { initialState, emptyResources };
