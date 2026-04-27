import { View } from "react-native";
import { useState } from "react";

import { BuildingCard } from "@/components/Colony/BuildingCard";
import { Slot } from "@/components/Colony/Slot";
import { useMiniEvent } from "@/hooks/useMiniEvent";
import { useColonyStore } from "@/store/colonyStore";

export function Grid() {
  const slots = useColonyStore((s) => s.slots);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const miniEvent = useMiniEvent();

  const rows = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
  ];

  // First-build tutorial: when the grid is completely empty, highlight
  // the centre slot with a pulsing glow so a brand-new player has an
  // unmistakable cue for "tap here to start". Once any building is
  // placed, the cue disappears forever for that colony.
  const hasAnyBuilding = slots.some((s) => s !== null);
  const tutorialIndex = hasAnyBuilding ? -1 : 4;
  const sparkleIndex = miniEvent.active ? miniEvent.targetSlot : null;

  return (
    <View className="gap-2">
      {rows.map((row, r) => (
        <View key={r} className="flex-row gap-2">
          {row.map((i) => (
            <Slot
              key={i}
              slot={slots[i]}
              index={i}
              tutorialGlow={i === tutorialIndex}
              sparkle={i === sparkleIndex}
              onPress={(idx) => setActiveIndex(idx)}
            />
          ))}
        </View>
      ))}

      <BuildingCard
        visible={activeIndex !== null}
        slotIndex={activeIndex ?? 0}
        building={activeIndex !== null ? slots[activeIndex] : null}
        onClose={() => setActiveIndex(null)}
      />
    </View>
  );
}
