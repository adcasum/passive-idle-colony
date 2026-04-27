import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import i18next from "i18next";

import { Card } from "@/components/UI/Card";
import { bloomStatus } from "@/lib/bloomEvent";

/**
 * "Spring Bloom" banner — surfaces the active or upcoming bloom event.
 *
 * Active state: bright gradient + countdown to bloom end + "+50% all
 * production" caption. Inactive state: muted card + countdown to next
 * bloom open. Always visible so the player has a recurring reason to
 * come back.
 */
export function BloomBanner() {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const status = bloomStatus(now);
  const targetMs = status.active ? status.endMs : status.startMs;
  const remainingMs = Math.max(0, targetMs - now);

  if (status.active) {
    return (
      <View
        style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#FFC940" }}
      >
        <LinearGradient
          colors={["#FFC94055", "#FFAA3A33"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 14 }}
        >
          <Text style={{ color: "#FFF4D6", fontSize: 13, fontWeight: "700" }}>
            🌸 {t("bloom.active_title")}
          </Text>
          <Text style={{ color: "#FFE8A8", fontSize: 12, marginTop: 4 }}>
            {t("bloom.active_body", { mult: status.multiplier.toFixed(1) })}
          </Text>
          <Text style={{ color: "#FFE8A8", fontSize: 11, marginTop: 6, opacity: 0.85 }}>
            {t("bloom.ends_in", { time: formatDuration(remainingMs, t) })}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // Inactive state: surface "next bloom on Tue 05:00 UTC" alongside the
  // raw countdown so the event has a calendar handle, not just a ticking
  // clock. Players plan around days of the week far better than around
  // arbitrary hour counts.
  const calendar = formatCalendar(status.startMs);
  return (
    <Card>
      <Text className="text-ink-mute text-xs">🌱 {t("bloom.inactive_title")}</Text>
      <Text className="text-ink text-sm mt-1">
        {t("bloom.inactive_body", { time: formatDuration(remainingMs, t) })}
      </Text>
      <Text className="text-accent text-[11px] mt-1">
        {t("bloom.calendar_label", { calendar })}
      </Text>
    </Card>
  );
}

function formatCalendar(startMs: number): string {
  // Use the active i18n locale so days-of-week are localized (e.g. "вт"
  // for ru, "Tue" for en, "火" for ja). 05:00 UTC is rendered as the
  // player's local time, so a player in UTC+3 sees "08:00".
  const lang = i18next.language || "en";
  const date = new Date(startMs);
  const weekday = date.toLocaleDateString(lang, {
    weekday: "short",
  });
  const time = date.toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${weekday} ${time}`;
}

function formatDuration(ms: number, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return t("bloom.fmt_dh", { d: days, h: hours });
  if (hours > 0) return t("bloom.fmt_hm", { h: hours, m: mins });
  return t("bloom.fmt_m", { m: mins });
}
