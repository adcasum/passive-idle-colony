import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { BUILDINGS } from "@/constants/buildings";
import { toast } from "@/lib/toast";
import { useColonyStore } from "@/store/colonyStore";
import { useEngagementStore } from "@/store/engagementStore";

const STORAGE_WARN_RATIO = 0.85;

/**
 * Show a "vault almost full" toast at most once per local day, when any
 * resource crosses 85% of the colony's storage cap. Cheap mount-side
 * effect — designed to be installed at the top of the Home screen.
 *
 * The de-duplication is via `engagementStore.shownToasts` so a refresh
 * within the same day doesn't re-fire it.
 */
export function useStorageWarning() {
  const { t } = useTranslation();
  const resources = useColonyStore((s) => s.resources);
  const slots = useColonyStore((s) => s.slots);
  const shownToasts = useEngagementStore((s) => s.shownToasts);
  const noteToastShown = useEngagementStore((s) => s.noteToastShown);

  useEffect(() => {
    if (shownToasts.includes("storage_warn")) return;

    let cap = 200;
    for (const slot of slots) {
      if (!slot) continue;
      const def = BUILDINGS[slot.kind];
      cap += (def.storageBonusPerLevel ?? 0) * slot.level;
    }

    const maxStored = Math.max(
      resources.honey,
      resources.energy,
      resources.food,
      resources.water,
    );

    if (cap > 0 && maxStored / cap >= STORAGE_WARN_RATIO) {
      toast.info(t("toast.storage_warn"), 4000);
      noteToastShown("storage_warn");
    }
  }, [resources, slots, shownToasts, noteToastShown, t]);
}
