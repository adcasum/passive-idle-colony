import { Text, View } from "react-native";

import { ResourceChip } from "@/components/UI/ResourceChip";
import type { Resources } from "@/types";

interface Props {
  resources: Resources;
  pending: Resources;
  storageCap: number;
}

/**
 * Compact resource bar — shown at the top of the Colony / Rewards screens
 * so users can always see what they have. Pending values shown as faded
 * "+N" overlays on the right of each chip.
 */
export function ColonyHeader({ resources, pending, storageCap }: Props) {
  return (
    <View className="px-4 pt-2 pb-3 bg-bg border-b border-border">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-ink-mute text-xs tracking-widest">YOUR COLONY</Text>
        <Text className="text-ink-mute text-[10px]">CAP {storageCap}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <ResourceChip kind="honey" value={resources.honey} pending={pending.honey} cap={storageCap} />
        <ResourceChip kind="energy" value={resources.energy} pending={pending.energy} cap={storageCap} />
        <ResourceChip kind="food" value={resources.food} pending={pending.food} cap={storageCap} />
        <ResourceChip kind="water" value={resources.water} pending={pending.water} cap={storageCap} />
      </View>
    </View>
  );
}
