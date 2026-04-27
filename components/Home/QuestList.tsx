import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/UI/Card";
import { useDailyQuests } from "@/hooks/useDailyQuests";

/**
 * Daily quests panel. Renders the 4 active quests with progress bars and
 * a small footer telling the player when the set rolls over.
 *
 * Reward payout is currently cosmetic (XP comes via login already), but the
 * UI is shaped so we can wire honey rewards in without further design work.
 */
export function QuestList() {
  const { t } = useTranslation();
  const { quests, completedCount, total, allDone } = useDailyQuests();

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-ink text-base font-semibold">
          {t("quests.section_title")}
        </Text>
        <Text className="text-ink-mute text-xs">
          {completedCount}/{total}
        </Text>
      </View>

      <View className="gap-3">
        {quests.map((q) => {
          const fraction = Math.min(1, q.state.progress / q.def.target);
          return (
            <View key={q.def.id}>
              <View className="flex-row justify-between items-center mb-1">
                <Text
                  className={
                    q.state.completed
                      ? "text-ink-dim text-sm line-through"
                      : "text-ink text-sm"
                  }
                  numberOfLines={2}
                >
                  {t(q.def.titleKey)}
                </Text>
                <Text className="text-accent text-[11px] font-semibold ml-2">
                  {q.state.completed
                    ? t("quests.completed")
                    : t("quests.in_progress", {
                        current: q.state.progress,
                        target: q.def.target,
                      })}
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "rgba(255, 244, 214, 0.10)",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${fraction * 100}%`,
                    height: "100%",
                    backgroundColor: q.state.completed ? "#A5E36F" : "#FFC940",
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text className="text-ink-mute text-[11px] mt-1">
                {t("quests.reward_honey", { amount: q.def.reward })}
              </Text>
            </View>
          );
        })}
      </View>

      {allDone ? (
        <Text className="text-ink-dim text-xs mt-3 text-center italic">
          {t("quests.all_done")}
        </Text>
      ) : null}
    </Card>
  );
}
