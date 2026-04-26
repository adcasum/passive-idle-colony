import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { fmtNum } from "@/lib/format";
import { RESOURCE_COLOR, RESOURCE_EMOJI, RESOURCE_LABEL } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

interface Props {
  kind: ResourceKind;
  value: number;
  pending?: number;
  cap?: number;
  showLabel?: boolean;
  small?: boolean;
}

/**
 * Resource counter with a subtle pulse animation each time the value changes.
 * Text content updates via React state (driven by a parent tick) — animating
 * the actual text content of a <Text> component is not supported in RN 0.76 +
 * Reanimated 3, so we keep the visible value plain and animate scale instead.
 */
export function AnimatedResource({
  kind,
  value,
  pending = 0,
  cap,
  showLabel = true,
  small = false,
}: Props) {
  const target = value + pending;
  const displayed = fmtNum(target);
  const scale = useSharedValue(1);
  const lastDisplayed = useRef(displayed);

  // Pulse only when the formatted number actually changes (avoids running on
  // every 1s tick when nothing visible changed).
  useEffect(() => {
    if (lastDisplayed.current !== displayed) {
      lastDisplayed.current = displayed;
      scale.value = 1.06;
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }
  }, [displayed, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-row items-center gap-2">
      <Text style={{ fontSize: small ? 16 : 22 }}>{RESOURCE_EMOJI[kind]}</Text>
      <View>
        {showLabel ? (
          <Text
            className="text-ink-mute"
            style={{ fontSize: small ? 10 : 11, letterSpacing: 0.5 }}
          >
            {RESOURCE_LABEL[kind].toUpperCase()}
          </Text>
        ) : null}
        <View className="flex-row items-baseline gap-1">
          <Animated.Text
            style={[
              {
                color: RESOURCE_COLOR[kind],
                fontSize: small ? 14 : 18,
                fontWeight: "700",
              },
              animStyle,
            ]}
          >
            {displayed}
          </Animated.Text>
          {cap !== undefined ? (
            <Text className="text-ink-mute" style={{ fontSize: small ? 10 : 12 }}>
              / {fmtNum(cap)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
