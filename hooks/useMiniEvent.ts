import { useEffect, useState } from "react";

import { miniEventStatus, type MiniEventStatus } from "@/lib/miniEvent";
import { useColonyStore } from "@/store/colonyStore";

/**
 * Reactively expose the current mini-event window. The window changes
 * every 10 minutes (active vs quiet) and the targeted slot only changes
 * on a 45-minute grid, so a 15-second poll is plenty for UI cueing.
 */
export function useMiniEvent(pollMs = 15_000): MiniEventStatus {
  const slots = useColonyStore((s) => s.slots);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const occupied = slots
    .map((s, i) => (s ? i : -1))
    .filter((i) => i >= 0);

  return miniEventStatus(now, occupied);
}
