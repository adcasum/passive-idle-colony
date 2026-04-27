import { useEffect } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { GradientCard } from "@/components/UI/Card";
import { useColonyLevel } from "@/hooks/useColonyLevel";
import { useWallet } from "@/hooks/useWallet";
import { queenColonyName } from "@/lib/queenName";

const HERO_GRADIENT: [string, string] = ["#3D2A0E", "#1A140A"];

/**
 * Top-of-Home narrative hero: the queen's mark, the colony's name, and a
 * level/XP progress bar. Pure presentational — no side effects.
 */
export function NarrativeHero() {
  const { t } = useTranslation();
  const { address } = useWallet();
  const colonyName = queenColonyName(address);
  const { level, progress, isMax, tierKey } = useColonyLevel();

  const greeting = address
    ? t("home.greeting", { name: colonyName })
    : t("home.greeting_anon");

  return (
    <GradientCard colors={HERO_GRADIENT} className="pt-5 pb-5">
      <View className="flex-row items-center">
        <Text style={{ fontSize: 56 }}>👑</Text>
        <View className="flex-1 ml-3">
          <Text className="text-ink-dim text-xs uppercase tracking-widest">
            {t(tierKey)}
          </Text>
          <Text
            className="text-ink text-xl font-bold"
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {greeting}
          </Text>
          <Text className="text-accent text-sm font-semibold mt-1">
            {t("home.colony_level", { level })}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <ProgressBar progress={progress} />
        <Text className="text-ink-mute text-[11px] mt-1 text-right">
          {isMax ? t("home.level_full_label") : null}
        </Text>
      </View>
    </GradientCard>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, w]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${w.value * 100}%`,
  }));

  return (
    <View
      style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255, 244, 214, 0.12)",
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          fillStyle,
          {
            height: "100%",
            backgroundColor: "#FFC940",
            borderRadius: 4,
          },
        ]}
      />
    </View>
  );
}
