import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { fmtNum } from "@/lib/format";
import { RESOURCE_COLOR, RESOURCE_EMOJI, RESOURCE_LABEL } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

const AnimatedText = Animated.createAnimatedComponent(Text);

interface Props {
  kind: ResourceKind;
  value: number;
  pending?: number;
  cap?: number;
  showLabel?: boolean;
  small?: boolean;
}

/**
 * Smoothly tweens the displayed amount whenever `value + pending` changes,
 * giving idle resources a satisfying "ticking up" feel.
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
  const animated = useSharedValue(target);

  useEffect(() => {
    animated.value = withTiming(target, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
  }, [animated, target]);

  const animatedProps = useAnimatedProps(() => {
    return { text: fmtNum(animated.value) } as unknown as object;
  });

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
          <AnimatedText
            animatedProps={animatedProps}
            style={{
              color: RESOURCE_COLOR[kind],
              fontSize: small ? 14 : 18,
              fontWeight: "700",
            }}
          >
            {fmtNum(target)}
          </AnimatedText>
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
