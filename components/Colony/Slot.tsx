import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useEffect } from "react";

import { BUILDINGS } from "@/constants/buildings";
import type { Slot as SlotType } from "@/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  slot: SlotType;
  index: number;
  onPress: (index: number) => void;
}

export function Slot({ slot, index, onPress }: Props) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (slot) {
      pulse.value = 0;
      scale.value = 0.85;
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    }
  }, [slot, pulse, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
      className={`flex-1 aspect-square rounded-2xl border items-center justify-center ${
        slot
          ? "bg-bg-card border-border-strong"
          : "bg-bg-elevated border-border border-dashed"
      }`}
    >
      {slot ? (
        <View className="items-center">
          <Text style={{ fontSize: 38 }}>{BUILDINGS[slot.kind].emoji}</Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Text className="text-ink-dim text-[10px]">L{slot.level}</Text>
            {slot.skinMint ? (
              <Text className="text-accent text-[10px]">✨</Text>
            ) : null}
          </View>
        </View>
      ) : (
        <Text className="text-ink-mute text-3xl">＋</Text>
      )}
    </AnimatedPressable>
  );
}
