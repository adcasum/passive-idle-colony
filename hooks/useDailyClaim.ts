import { useEffect, useMemo, useState } from "react";

import { CLAIM_COOLDOWN_HOURS } from "@/constants/buildings";
import { haptic } from "@/lib/haptics";
import { scheduleClaimReadyNotification } from "@/lib/notifications";
import { useColonyStore } from "@/store/colonyStore";
import { useRewardsStore } from "@/store/rewardsStore";

const MS_PER_HOUR = 3_600_000;

export function useDailyClaim() {
  const lastClaimAt = useColonyStore((s) => s.lastClaimAt);
  const claim = useColonyStore((s) => s.claim);
  const recordClaim = useRewardsStore((s) => s.recordClaim);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cooldownMs = CLAIM_COOLDOWN_HOURS * MS_PER_HOUR;
  const elapsedMs = Math.max(0, now - lastClaimAt);
  const canClaim = elapsedMs >= cooldownMs;
  const remainingMs = Math.max(0, cooldownMs - elapsedMs);

  const remainingLabel = useMemo(() => {
    if (canClaim) return "Ready!";
    const totalSec = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [canClaim, remainingMs]);

  const doClaim = async () => {
    if (!canClaim) {
      haptic.error();
      return null;
    }
    const result = claim();
    recordClaim(result);
    haptic.claim();
    // Schedule the next reminder.
    scheduleClaimReadyNotification(CLAIM_COOLDOWN_HOURS).catch(() => undefined);
    return result;
  };

  return {
    canClaim,
    remainingMs,
    remainingLabel,
    doClaim,
    cooldownHours: CLAIM_COOLDOWN_HOURS,
  };
}
