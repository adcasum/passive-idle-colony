import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CLAIM_COOLDOWN_HOURS } from "@/constants/buildings";
import { useColonyData } from "@/hooks/useColonyData";
import { currentQueenLine, type QueenLine } from "@/lib/queenVoice";

/**
 * Small text bubble below the NarrativeHero: a one-line note from the
 * Queen reflecting the colony's current state. Re-evaluated every 15 s
 * (cheap) and animated on context change.
 */
export function QueenVoice() {
  const { t } = useTranslation();
  const { resources, storageCap, slots, lastClaimAt, pending } = useColonyData(15_000);
  const [line, setLine] = useState<QueenLine | null>(null);

  useEffect(() => {
    const builtCount = slots.filter((s) => s !== null).length;
    const cooldownMs = CLAIM_COOLDOWN_HOURS * 3_600_000;
    const claimReady = Date.now() - lastClaimAt >= cooldownMs;
    // `pending.hours` is the accrued time-window (capped at the offline
    // accrual ceiling); good enough proxy for "how much value is sitting
    // unclaimed" for line-picking purposes.
    const pendingHours = pending.hours;

    const next = currentQueenLine({
      resources,
      storageCap,
      builtCount,
      pendingHours,
      claimReady,
    });
    setLine((prev) => (prev?.id === next.id ? prev : next));
  }, [resources, storageCap, slots, lastClaimAt, pending]);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    if (!line) return;
    opacity.value = 0;
    translateY.value = 6;
    opacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) });
  }, [line, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!line) return null;

  return (
    <Animated.View style={animStyle}>
      <View
        style={{
          backgroundColor: "#2A1F12",
          borderColor: "#FFC94055",
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 8 }}>👑</Text>
        <Text
          style={{
            color: "#FFF4D6",
            flex: 1,
            fontStyle: "italic",
            lineHeight: 20,
          }}
        >
          {t(line.key, line.params)}
        </Text>
      </View>
    </Animated.View>
  );
}
