import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CLAIM_COOLDOWN_HOURS, RESOURCE_EMOJI } from "@/constants/buildings";
import { onClaimed } from "@/lib/engagementEvents";
import { fmtNum } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { scheduleClaimReadyNotification } from "@/lib/notifications";
import { toast } from "@/lib/toast";
import type { ResourceKind } from "@/types";
import { useColonyStore } from "@/store/colonyStore";
import { useRewardsStore } from "@/store/rewardsStore";

const MS_PER_HOUR = 3_600_000;

export function useDailyClaim() {
  const lastClaimAt = useColonyStore((s) => s.lastClaimAt);
  const claim = useColonyStore((s) => s.claim);
  const recordClaim = useRewardsStore((s) => s.recordClaim);
  const { t } = useTranslation();

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
    if (canClaim) return t("claim.ready");
    const totalSec = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [canClaim, remainingMs, t]);

  const doClaim = async () => {
    if (!canClaim) {
      haptic.error();
      toast.error(t("toast.claim_cooldown"));
      return null;
    }
    const result = claim();
    recordClaim(result);
    onClaimed(result.cappedAt.honey);
    haptic.claim();
    // Surface the actual amounts that were just credited so the UI feels alive.
    // Use cappedAt (post-cap delta) — produced is the uncapped raw figure and
    // would overstate gains when storage is near full.
    const parts = (Object.keys(result.cappedAt) as ResourceKind[])
      .filter((k) => result.cappedAt[k] > 0)
      .map((k) => `${RESOURCE_EMOJI[k]}+${fmtNum(result.cappedAt[k])}`);
    toast.success(
      parts.length
        ? t("toast.claimed", { parts: parts.join(" ") })
        : t("toast.claimed_nothing"),
    );
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
