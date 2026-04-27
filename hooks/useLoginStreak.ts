import { useEffect } from "react";

import { useEngagementStore } from "@/store/engagementStore";
import { _internals as questInternals } from "@/hooks/useDailyQuests";

/**
 * Login streak hook. Side-effect on mount: records today's login (idempotent
 * for the same local day). Exposes the current streak + best so the Home
 * screen can render a 🔥 badge and a 7-day ribbon.
 */
export function useLoginStreak() {
  const streak = useEngagementStore((s) => s.streak);
  const bestStreak = useEngagementStore((s) => s.bestStreak);
  const lastLoginDay = useEngagementStore((s) => s.lastLoginDay);
  const recordLogin = useEngagementStore((s) => s.recordLogin);

  useEffect(() => {
    const today = questInternals.localQuestDay();
    recordLogin(today);
  }, [recordLogin]);

  // 7-day ribbon: which days inside the current streak are filled?
  // We surface the latest 7 entries: index 0 is today, index 6 is 6 days back.
  const ribbon: readonly { day: number; filled: boolean; isToday: boolean }[] =
    Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      filled: i < Math.min(7, streak),
      isToday: i === Math.min(6, Math.max(0, streak - 1)),
    }));

  return {
    streak,
    bestStreak,
    lastLoginDay,
    ribbon,
  };
}
