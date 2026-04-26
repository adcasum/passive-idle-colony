import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { RESOURCE_EMOJI } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

interface BurstProps {
  visible: boolean;
  resources: ResourceKind[];
  onDone?: () => void;
}

/**
 * Brief celebration: emojis fly upward + fade. Used on successful claim / mint.
 * Self-managing: starts when visible flips true, calls onDone when done.
 */
export function ResourceBurst({ visible, resources, onDone }: BurstProps) {
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setRenderKey((k) => k + 1);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {resources.map((kind, i) => (
        <FlyingEmoji
          key={`${renderKey}-${kind}-${i}`}
          kind={kind}
          delay={i * 90}
          onDone={i === resources.length - 1 ? onDone : undefined}
        />
      ))}
    </View>
  );
}

function FlyingEmoji({
  kind,
  delay,
  onDone,
}: {
  kind: ResourceKind;
  delay: number;
  onDone?: () => void;
}) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);
  const x = (Math.random() - 0.5) * 120;

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 120 }));
    scale.value = withDelay(
      delay,
      withTiming(1.3, { duration: 350, easing: Easing.out(Easing.quad) }),
    );
    ty.value = withDelay(
      delay,
      withTiming(
        -180,
        { duration: 1200, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished && onDone) runOnJS(onDone)();
        },
      ),
    );
    const fadeId = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 });
    }, delay + 700);
    return () => clearTimeout(fadeId);
  }, [delay, onDone, opacity, scale, ty]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { translateX: x }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: "absolute" }, style]}>
      <Text style={{ fontSize: 32 }}>{RESOURCE_EMOJI[kind]}</Text>
    </Animated.View>
  );
}
