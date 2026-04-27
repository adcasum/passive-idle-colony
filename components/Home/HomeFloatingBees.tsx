import { useEffect, useMemo } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Decorative floating bees that drift across the Home screen background.
 * Pure aesthetic — no interaction, no game state. Each bee has its own
 * random horizontal range, vertical bob, rotation, and tempo so the
 * pattern never feels mechanical.
 *
 * Performance: uses Reanimated worklets exclusively (no JS-thread
 * timers), so it's effectively free even on low-end Android.
 */
export function HomeFloatingBees({ count = 3 }: { count?: number }) {
  // useWindowDimensions reacts to rotation / split-screen — Dimensions.get
  // captured-once would leave bees flying off the wrong edge after a
  // device rotation.
  const { width } = useWindowDimensions();
  // Memoize per-bee config so re-renders don't reseed the animations.
  // Re-key on width so a rotation builds fresh travel ranges; we accept
  // a one-time animation reset on rotation as a fair price for accuracy.
  const config = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      // Stagger starting Y so they don't all share a horizon line.
      topPct: 6 + i * 14 + Math.random() * 6,
      // Each bee gets its own period and direction.
      durationMs: 14_000 + Math.random() * 9_000,
      delayMs: i * 1_500 + Math.random() * 2_000,
      rangePx: width + 80,
      reversed: i % 2 === 1,
      // Vertical bob amplitude
      bob: 10 + Math.random() * 8,
    }));
  }, [count, width]);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {config.map((c) => (
        <Bee key={c.id} {...c} />
      ))}
    </View>
  );
}

function Bee({
  topPct,
  durationMs,
  delayMs,
  rangePx,
  reversed,
  bob,
}: {
  topPct: number;
  durationMs: number;
  delayMs: number;
  rangePx: number;
  reversed: boolean;
  bob: number;
}) {
  const x = useSharedValue(reversed ? rangePx : -40);
  const y = useSharedValue(0);
  const rot = useSharedValue(reversed ? 180 : 0);

  useEffect(() => {
    const target = reversed ? -40 : rangePx;
    x.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(target, {
          duration: durationMs,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
    y.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(bob, { duration: durationMs / 4, easing: Easing.inOut(Easing.sin) }),
          withTiming(-bob, { duration: durationMs / 4, easing: Easing.inOut(Easing.sin) }),
          withTiming(bob, { duration: durationMs / 4, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: durationMs / 4, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    // Static facing — bees always look forward in their direction of travel.
    rot.value = reversed ? 180 : 0;
  }, [bob, delayMs, durationMs, rangePx, reversed, rot, x, y]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotateY: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: `${topPct}%`,
          opacity: 0.7,
        },
        animStyle,
      ]}
    >
      <Text style={{ fontSize: 22 }}>🐝</Text>
    </Animated.View>
  );
}
