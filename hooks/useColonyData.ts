import { useEffect, useState } from "react";

import { useColonyStore } from "@/store/colonyStore";
import {
  colonyProductionPerHour,
  computePending,
  maxStorage,
  researchBoost,
} from "@/lib/colonyMath";

/**
 * Live colony data + production. Re-renders the pending production every
 * `tickMs` ms so the UI animates (resource numbers tick up gently).
 */
export function useColonyData(tickMs = 1000) {
  const slots = useColonyStore((s) => s.slots);
  const resources = useColonyStore((s) => s.resources);
  const lastClaimAt = useColonyStore((s) => s.lastClaimAt);
  const hydrated = useColonyStore((s) => s.hydrated);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const pending = computePending({ slots, lastClaimAt }, now);
  const perHour = colonyProductionPerHour(slots);
  const cap = maxStorage(slots);
  const boost = researchBoost(slots);

  return {
    hydrated,
    slots,
    resources,
    lastClaimAt,
    perHour,
    pending,
    storageCap: cap,
    researchBoost: boost,
    now,
  };
}
