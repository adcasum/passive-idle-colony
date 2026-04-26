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

import { BUILDINGS, RESOURCE_COLOR } from "@/constants/buildings";
import type { Slot as SlotType } from "@/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const KIND_GLOW: Record<string, string> = {
  bee_hive: "#FACC15",
  solar_panel: "#F97316",
  small_farm: "#84CC16",
  water_collector: "#60A5FA",
  storage: "#A6B0C3",
  research_lab: "#A78BFA",
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

  const glow = slot ? KIND_GLOW[slot.kind] ?? "#A78BFA" : null;
  const def = slot ? BUILDINGS[slot.kind] : null;

  return (
    <AnimatedPressable
      style={animStyle}
      onPress={() => onPress(index)}
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
          colors={[`${glow}33`, "#1A2233"]}
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
                color: glow ?? "#F4F6FB",
                fontSize: 10,
                fontWeight: "700",
              }}
            >
              L{slot.level}
            </Text>
            {slot.skinMint ? (
              <Text style={{ color: "#FACC15", fontSize: 10 }}>★</Text>
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
          <Text className="text-ink-mute text-4xl" style={{ opacity: 0.4 }}>
            ＋
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
