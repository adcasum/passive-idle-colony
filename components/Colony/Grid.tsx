import { View } from "react-native";
import { useState } from "react";

import { BuildingCard } from "@/components/Colony/BuildingCard";
import { Slot } from "@/components/Colony/Slot";
import { useColonyStore } from "@/store/colonyStore";

export function Grid() {
  const slots = useColonyStore((s) => s.slots);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rows = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
  ];

  return (
    <View className="gap-2">
      {rows.map((row, r) => (
        <View key={r} className="flex-row gap-2">
          {row.map((i) => (
            <Slot
              key={i}
              slot={slots[i]}
              index={i}
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
