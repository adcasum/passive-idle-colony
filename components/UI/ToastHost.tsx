import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { subscribeToasts, type ToastEvent, type ToastKind } from "@/lib/toast";

interface VisibleToast {
  ev: ToastEvent;
}

const KIND_BG: Record<ToastKind, string> = {
  success: "#FFC940",
  error: "#FF6F61",
  info: "#2A1F12",
};
const KIND_FG: Record<ToastKind, string> = {
  success: "#1A140A",
  error: "#FFF4D6",
  info: "#FFF4D6",
};
const KIND_BORDER: Record<ToastKind, string> = {
  success: "#E0A810",
  error: "#B5392F",
  info: "#5A4220",
};

function ToastItem({
  ev,
  onDone,
  topOffset,
}: {
  ev: ToastEvent;
  onDone: () => void;
  topOffset: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);

  // Hold onDone in a ref so we can call the latest version from the
  // animation completion without making it a useEffect dependency. If we
  // listed onDone in the deps array, every parent re-render (e.g. when a
  // new toast is appended) would re-create the inline arrow at the call
  // site, restart this effect, and reset the dismiss timer indefinitely.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const dur = ev.durationMs ?? (ev.kind === "error" ? 3000 : 2200);
    // Reanimated cancels the previous animation when a shared value is
    // reassigned, so the fade-in and the delayed fade-out must be chained
    // through withSequence — otherwise the second assignment in the same
    // tick wipes out the fade-in and the toast stays invisible.
    opacity.value = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
      withDelay(
        dur,
        withTiming(
          0,
          { duration: 220, easing: Easing.in(Easing.quad) },
          (finished) => {
            if (finished) runOnJS(() => onDoneRef.current())();
          },
        ),
      ),
    );
    translateY.value = withSequence(
      withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }),
      withDelay(
        dur,
        withTiming(-12, { duration: 220, easing: Easing.in(Easing.quad) }),
      ),
    );
    // Intentionally only depends on ev.id — not onDone — so a parent
    // re-render appending another toast does not restart this animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev.id]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: "absolute",
          top: topOffset,
          left: 16,
          right: 16,
          backgroundColor: KIND_BG[ev.kind],
          borderColor: KIND_BORDER[ev.kind],
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
      ]}
      pointerEvents="none"
    >
      <Text
        style={{
          color: KIND_FG[ev.kind],
          fontWeight: "600",
          fontSize: 14,
        }}
      >
        {ev.message}
      </Text>
    </Animated.View>
  );
}

/**
 * Mounts once at the root and renders toasts emitted via lib/toast.
 * Stacks multiple toasts vertically; each fades + slides in at the top.
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<VisibleToast[]>([]);

  useEffect(() => {
    return subscribeToasts((ev) => {
      setItems((prev) => [...prev, { ev }]);
    });
  }, []);

  // Stable removeToast — defensive even though ToastItem internally pins
  // onDone to a ref, so animations would not restart anyway.
  const removeToast = useCallback((id: number) => {
    setItems((prev) => prev.filter((p) => p.ev.id !== id));
  }, []);

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
    >
      {items.map((it, i) => (
        <ToastItem
          key={it.ev.id}
          ev={it.ev}
          topOffset={insets.top + 8 + i * 64}
          onDone={() => removeToast(it.ev.id)}
        />
      ))}
    </View>
  );
}
