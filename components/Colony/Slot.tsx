import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  BUILDINGS,
  RESOURCE_COLOR,
  RESOURCE_EMOJI,
  RESOURCE_LABEL,
} from "@/constants/buildings";
import { fmtNum } from "@/lib/format";
import { buildingProductionPerHour, upgradeCost } from "@/lib/colonyMath";
import { toast } from "@/lib/toast";
import type { Slot as SlotType } from "@/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const KIND_GLOW: Record<string, string> = {
  bee_hive: "#FFC940",
  solar_panel: "#FFAA3A",
  small_farm: "#A5E36F",
  water_collector: "#7DD3FC",
  storage: "#E2C99A",
  research_lab: "#FFD580",
};

interface Props {
  slot: SlotType;
  index: number;
  onPress: (index: number) => void;
}

export function Slot({ slot, index, onPress }: Props) {
  const scale = useSharedValue(1);
  const wiggle = useSharedValue(0);

  useEffect(() => {
    if (slot) {
      scale.value = 0.85;
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      // Tiny wiggle on first appearance
      wiggle.value = withSequence(
        withTiming(-0.04, { duration: 90 }),
        withTiming(0.04, { duration: 90 }),
        withTiming(0, { duration: 90 }),
      );
    }
  }, [slot, scale, wiggle]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${wiggle.value}rad` }],
  }));

  const glow = slot ? KIND_GLOW[slot.kind] ?? "#FFC940" : null;
  const def = slot ? BUILDINGS[slot.kind] : null;

  // Long-press preview: surface the building's stats without forcing the user
  // through the full bottom-sheet (and without triggering build/upgrade).
  const handleLongPress = () => {
    if (!slot || !def) {
      toast.info("Empty slot — tap to build");
      return;
    }
    const prod = buildingProductionPerHour(slot);
    const isMax = slot.level >= def.maxLevel;
    const next = isMax ? null : upgradeCost(slot.kind, slot.level);
    const prodLabel = prod.resource
      ? `${RESOURCE_EMOJI[prod.resource]} +${fmtNum(prod.amount)} ${RESOURCE_LABEL[prod.resource]}/hr`
      : def.researchBoostPerLevel
        ? `+${(def.researchBoostPerLevel * slot.level * 100).toFixed(0)}% global`
        : def.storageBonusPerLevel
          ? `+${def.storageBonusPerLevel * slot.level} cap`
          : "";
    const costLabel = next
      ? Object.entries(next)
          .filter(([, v]) => (v ?? 0) > 0)
          .map(
            ([k, v]) =>
              `${RESOURCE_EMOJI[k as keyof typeof RESOURCE_EMOJI]}${fmtNum(v ?? 0)}`,
          )
          .join(" ")
      : "MAX";
    toast.info(
      `${def.name} L${slot.level}  •  ${prodLabel}  •  next ${costLabel}`,
      3500,
    );
  };

  return (
    <AnimatedPressable
      style={animStyle}
      onPress={() => onPress(index)}
      onLongPress={handleLongPress}
      delayLongPress={350}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 14, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      className={`flex-1 aspect-square rounded-2xl border items-center justify-center overflow-hidden ${
        slot
          ? "border-border-strong"
          : "bg-bg-elevated border-border border-dashed"
      }`}
    >
      {slot && glow ? (
        <LinearGradient
          colors={[`${glow}55`, "#2A1F12"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          pointerEvents="none"
        />
      ) : null}

      {slot && def ? (
        <View className="items-center" pointerEvents="none">
          <Text style={{ fontSize: 38 }}>{def.emoji}</Text>
          <View className="mt-1 flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-black/30">
            <Text
              style={{
                color: glow ?? "#FFF4D6",
                fontSize: 10,
                fontWeight: "700",
              }}
            >
              L{slot.level}
            </Text>
            {slot.skinMint ? (
              <Text style={{ color: "#FFC940", fontSize: 10 }}>★</Text>
            ) : null}
          </View>
          {def.produces ? (
            <View
              className="absolute -bottom-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: RESOURCE_COLOR[def.produces] }}
            />
          ) : null}
        </View>
      ) : (
        <View
          className="items-center justify-center"
          pointerEvents="none"
        >
          <Text style={{ fontSize: 26, opacity: 0.5 }}>⬢</Text>
          <Text
            className="text-ink-mute text-2xl mt-0.5"
            style={{ opacity: 0.7, fontWeight: "600" }}
          >
            +
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
