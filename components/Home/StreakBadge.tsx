import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/UI/Card";
import { useLoginStreak } from "@/hooks/useLoginStreak";

/**
 * 7-day login streak ribbon + headline.
 *
 * The ribbon shows 7 small day-cells. Filled cells correspond to days
 * already inside the current streak; the rightmost filled cell is "today".
 */
export function StreakBadge() {
  const { t } = useTranslation();
  const { streak, ribbon } = useLoginStreak();

  const headline = streak > 0 ? t("streak.label", { days: streak }) : t("streak.label_zero");

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-ink text-base font-semibold">{headline}</Text>
        <Text className="text-ink-mute text-[11px] uppercase tracking-widest">
          {t("streak.title")}
        </Text>
      </View>
      <View className="flex-row gap-1">
        {ribbon.map((d) => (
          <View
            key={d.day}
            style={{
              flex: 1,
              height: 28,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: d.isToday ? 1 : 0,
              borderColor: "#FFC940",
              backgroundColor: d.filled
                ? "rgba(255, 201, 64, 0.85)"
                : "rgba(255, 244, 214, 0.10)",
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: d.filled ? "#1A140A" : "#FFF4D680" }}
            >
              {d.filled ? t("streak.day_done") : t("streak.day_short", { day: d.day })}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
