import { Text, View } from "react-native";

import { fmtNum } from "@/lib/format";
import { RESOURCE_COLOR, RESOURCE_EMOJI } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

interface Props {
  kind: ResourceKind;
  value: number;
  pending?: number;
  /** Optional cap; if set, the chip shows a thin progress bar underneath. */
  cap?: number;
}

/**
 * Compact resource pill used in the persistent header. Optionally renders a
 * tiny capacity bar so users can see how close they are to the storage cap.
 */
export function ResourceChip({ kind, value, pending = 0, cap }: Props) {
  const total = value + pending;
  const ratio = cap && cap > 0 ? Math.min(1, total / cap) : null;
  const color = RESOURCE_COLOR[kind];
  return (
    <View className="px-2.5 py-1 rounded-full bg-bg-elevated border border-border">
      <View className="flex-row items-center gap-1">
        <Text style={{ fontSize: 14 }}>{RESOURCE_EMOJI[kind]}</Text>
        <Text style={{ fontSize: 12, fontWeight: "700", color }}>
          {fmtNum(total)}
        </Text>
      </View>
      {ratio !== null ? (
        <View
          className="mt-1 h-0.5 rounded-full bg-black/30 overflow-hidden"
          style={{ width: 44 }}
        >
          <View
            style={{
              width: `${ratio * 100}%`,
              backgroundColor: color,
              height: "100%",
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
