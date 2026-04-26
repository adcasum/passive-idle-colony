import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedResource } from "@/components/UI/AnimatedResource";
import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { useColonyData } from "@/hooks/useColonyData";
import { useDailyClaim } from "@/hooks/useDailyClaim";
import { useRewardsStore } from "@/store/rewardsStore";
import { fmtNum } from "@/lib/format";
import { RESOURCE_EMOJI, RESOURCE_LABEL } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

const RESOURCES: ResourceKind[] = ["honey", "energy", "food", "water"];

export default function RewardsScreen() {
  const { pending } = useColonyData();
  const { canClaim, remainingLabel, doClaim } = useDailyClaim();
  const totalClaimed = useRewardsStore((s) => s.totalClaimed);
  const history = useRewardsStore((s) => s.history);

  const handleClaim = async () => {
    const r = await doClaim();
    if (r) {
      Alert.alert(
        "Rewards claimed!",
        RESOURCES.map(
          (k) =>
            `${RESOURCE_EMOJI[k]} ${RESOURCE_LABEL[k]}: +${fmtNum(r.cappedAt[k])}`,
        ).join("\n"),
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text className="text-ink-mute text-xs mb-3 tracking-widest">
            PENDING (NOT YET CLAIMED)
          </Text>
          <View className="flex-row flex-wrap gap-y-3">
            {RESOURCES.map((k) => (
              <View key={k} className="w-1/2">
                <AnimatedResource
                  kind={k}
                  value={0}
                  pending={pending.produced[k]}
                />
              </View>
            ))}
          </View>
          <Text className="text-ink-mute text-xs mt-2 mb-3">
            Accumulated over {fmtNum(pending.hours)} hours
          </Text>
          <Button
            label={canClaim ? "Claim Now" : `Cooldown ${remainingLabel}`}
            disabled={!canClaim}
            onPress={handleClaim}
          />
        </Card>

        <Card>
          <Text className="text-ink-mute text-xs mb-3 tracking-widest">
            TOTAL CLAIMED (ALL TIME)
          </Text>
          <View className="flex-row flex-wrap gap-y-3">
            {RESOURCES.map((k) => (
              <View key={k} className="w-1/2">
                <AnimatedResource kind={k} value={totalClaimed[k]} />
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text className="text-ink-mute text-xs mb-3 tracking-widest">
            HISTORY
          </Text>
          {history.length === 0 ? (
            <Text className="text-ink-dim">No claims yet.</Text>
          ) : (
            history.map((h, i) => (
              <View
                key={i}
                className="border-t border-border first:border-t-0 py-3"
              >
                <Text className="text-ink-dim text-xs mb-1">
                  {new Date(h.at).toLocaleString()} • {fmtNum(h.hours)}h
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {RESOURCES.map((k) => (
                    <View key={k} className="flex-row items-center gap-1">
                      <Text>{RESOURCE_EMOJI[k]}</Text>
                      <Text className="text-ink">+{fmtNum(h.cappedAt[k])}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
