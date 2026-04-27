import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  BUILDINGS,
  RESOURCE_COLOR,
  RESOURCE_EMOJI,
  getBuildingName,
} from "@/constants/buildings";
import { onLongPressedSlot } from "@/lib/engagementEvents";
import { fmtNum } from "@/lib/format";
import { buildingProductionPerHour, upgradeCost } from "@/lib/colonyMath";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/toast";
import { useTapToTend } from "@/hooks/useTapToTend";
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
  /** When true, render a pulsing gold glow around the (empty) slot to
   *  cue a new player to tap here for their first build. */
  tutorialGlow?: boolean;
  /** When true, this is the mini-event's currently-spotlighted slot:
   *  render a cyan pulse so the player can find it at a glance. */
  sparkle?: boolean;
  onPress: (index: number) => void;
}

export function Slot({ slot, index, tutorialGlow, sparkle, onPress }: Props) {
  const scale = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const tutorialPulse = useSharedValue(0);
  const sparklePulse = useSharedValue(0);
  const { t } = useTranslation();
  const { tend } = useTapToTend(index);

  // Pulse the tutorial glow when active. Two-step easing — fade in over
  // 700 ms, fade out over 700 ms — looped indefinitely until the player
  // builds and the prop flips off.
  useEffect(() => {
    if (tutorialGlow) {
      tutorialPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0, { duration: 700 }),
        ),
        -1,
        false,
      );
    } else {
      tutorialPulse.value = withTiming(0, { duration: 200 });
    }
  }, [tutorialGlow, tutorialPulse]);

  // Mini-event sparkle: faster, tighter pulse than tutorial — cyan, draws
  // the eye but doesn't dominate the screen. Stops the moment the
  // 10-min window ends or the targeted slot rotates away.
  useEffect(() => {
    if (sparkle) {
      sparklePulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 450 }),
          withTiming(0, { duration: 450 }),
        ),
        -1,
        false,
      );
    } else {
      sparklePulse.value = withTiming(0, { duration: 200 });
    }
  }, [sparkle, sparklePulse]);

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

  const tutorialGlowStyle = useAnimatedStyle(() => ({
    opacity: tutorialPulse.value,
  }));

  const sparkleGlowStyle = useAnimatedStyle(() => ({
    opacity: sparklePulse.value,
  }));

  const glow = slot ? KIND_GLOW[slot.kind] ?? "#FFC940" : null;
  const def = slot ? BUILDINGS[slot.kind] : null;

  // Long-press preview: surface the building's stats without forcing the user
  // through the full bottom-sheet (and without triggering build/upgrade).
  const handleLongPress = () => {
    if (!slot || !def) {
      toast.info(t("slot_preview.empty"));
      return;
    }
    // Only count the quest after the player has actually surfaced production
    // stats — long-pressing an empty tile is just a "what is this?" prompt.
    onLongPressedSlot();
    const prod = buildingProductionPerHour(slot);
    const isMax = slot.level >= def.maxLevel;
    const next = isMax ? null : upgradeCost(slot.kind, slot.level);
    const name = t(getBuildingName(slot.kind));
    const prodLabel = prod.resource
      ? `${RESOURCE_EMOJI[prod.resource]} +${fmtNum(prod.amount)} ${t(`resources.${prod.resource}`)}${t("header.production_per_hour")}`
      : def.researchBoostPerLevel
        ? `+${(def.researchBoostPerLevel * slot.level * 100).toFixed(0)}%`
        : def.storageBonusPerLevel
          ? `+${def.storageBonusPerLevel * slot.level}`
          : "";
    const costLabel = next
      ? Object.entries(next)
          .filter(([, v]) => (v ?? 0) > 0)
          .map(
            ([k, v]) =>
              `${RESOURCE_EMOJI[k as keyof typeof RESOURCE_EMOJI]}${fmtNum(v ?? 0)}`,
          )
          .join(" ")
      : t("slot_preview.max_label");
    toast.info(
      `${name} L${slot.level}  •  ${prodLabel}  •  ${costLabel}`,
      3500,
    );
  };

  // Tap on a built tile fires a small "tend" bonus (if off cooldown) AND
  // opens the build card. Tend is silent on cooldown — the card still
  // opens so the player can upgrade / demolish without friction.
  //
  // We always call tend() and let it perform its own cooldown check via
  // useEngagementStore.getState(). Gating on the closure-captured
  // `canTend` here would go stale once a cooldown expired without a
  // re-render, so the first tap after the timer elapsed would fail to
  // grant the bonus.
  const handlePress = () => {
    if (slot) {
      const result = tend();
      if (result) {
        haptic.tap();
        if (result.cappedOut) {
          toast.info(t("toast.tend_capped", { resource: t(`resources.${result.resource}`) }));
        } else {
          // Build a single line that shows resource + amount + (if any)
          // a multiplier badge: e.g. "🍯+12 ×3 (Sparkle!)".
          const base = t("toast.tend", {
            amount: fmtNum(result.granted),
            emoji: RESOURCE_EMOJI[result.resource],
          });
          let suffix = "";
          if (result.sources.includes("mini")) {
            suffix = `  ×${result.multiplier} ${t("toast.tend_sparkle")}`;
          } else if (result.sources.includes("chain")) {
            suffix = `  ×${result.multiplier} ${t("toast.tend_chain", { length: result.chainLength })}`;
          }
          toast.success(`${base}${suffix}`);
        }
      }
    }
    onPress(index);
  };

  return (
    <AnimatedPressable
      style={animStyle}
      onPress={handlePress}
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

      {!slot && tutorialGlow ? (
        // Rendered INSIDE the parent so the parent's `overflow-hidden`
        // (used to clip the LinearGradient on built tiles) doesn't clip
        // the glow. We use an inset border + a translucent gold fill
        // for the pulse cue rather than an outer shadow.
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              borderWidth: 3,
              borderColor: "#FFC940",
              backgroundColor: "#FFC94022",
            },
            tutorialGlowStyle,
          ]}
        />
      ) : null}

      {slot && sparkle ? (
        // Mini-event spotlight. Cyan accent, slightly less alpha than
        // the tutorial glow so the building emoji underneath stays
        // readable. Inset border so the corners of the LinearGradient
        // gradient don't clip it.
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: "#7DD3FC",
              backgroundColor: "#7DD3FC22",
            },
            sparkleGlowStyle,
          ]}
        />
      ) : null}

      {slot && sparkle ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
          }}
        >
          <Text style={{ fontSize: 14 }}>✨</Text>
        </View>
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
