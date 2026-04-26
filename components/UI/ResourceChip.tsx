import { Text, View } from "react-native";

import { fmtNum } from "@/lib/format";
import { RESOURCE_COLOR, RESOURCE_EMOJI } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

interface Props {
  kind: ResourceKind;
  value: number;
  pending?: number;
}

/**
 * Compact resource pill used in the persistent header.
 */
export function ResourceChip({ kind, value, pending = 0 }: Props) {
  const total = value + pending;
  return (
    <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-bg-elevated border border-border">
      <Text style={{ fontSize: 14 }}>{RESOURCE_EMOJI[kind]}</Text>
      <Text
        className="text-ink"
        style={{ fontSize: 12, fontWeight: "700", color: RESOURCE_COLOR[kind] }}
      >
        {fmtNum(total)}
      </Text>
    </View>
  );
}
