import { useMemo } from "react";

import { colonyLevelInfo, colonyXp } from "@/lib/colonyLevel";
import { useColonyStore } from "@/store/colonyStore";
import { useEngagementStore } from "@/store/engagementStore";

/**
 * Read-side hook that derives a single level/XP snapshot from the current
 * colony + engagement state. Pure of any timer side-effects.
 */
export function useColonyLevel() {
  const slots = useColonyStore((s) => s.slots);
  const claimsMade = useEngagementStore((s) => s.claimsMade);
  const lifetimeHoney = useEngagementStore((s) => s.lifetimeHoneyClaimed);

  return useMemo(() => {
    const xp = colonyXp({
      slots,
      claimsMade,
      lifetimeHoneyClaimed: lifetimeHoney,
    });
    return colonyLevelInfo(xp);
  }, [slots, claimsMade, lifetimeHoney]);
}
