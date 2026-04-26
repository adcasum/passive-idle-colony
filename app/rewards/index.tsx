import { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClaimCard } from "@/components/Colony/ClaimCard";
import { ColonyHeader } from "@/components/Colony/ColonyHeader";
import { Card } from "@/components/UI/Card";
import { useColonyData } from "@/hooks/useColonyData";
import { pullColonyFromCloud } from "@/hooks/useCloudSync";
import { useRewardsStore } from "@/store/rewardsStore";
import { fmtNum } from "@/lib/format";
import { toast } from "@/lib/toast";
import { RESOURCE_COLOR, RESOURCE_EMOJI, RESOURCE_LABEL } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

const RESOURCES: ResourceKind[] = ["honey", "energy", "food", "water"];

export default function RewardsScreen() {
  const { resources, pending, storageCap } = useColonyData();
  const totalClaimed = useRewardsStore((s) => s.totalClaimed);
  const history = useRewardsStore((s) => s.history);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    const result = await pullColonyFromCloud();
    setRefreshing(false);
    if (result === "updated") toast.success("Synced from cloud");
    else if (result === "error") toast.error("Sync failed — try again");
    // "current" / "no-cloud" / "disabled" don't need user-facing feedback.
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ColonyHeader
        resources={resources}
        pending={pending.produced}
        storageCap={storageCap}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFC940"
            colors={["#FFC940"]}
          />
        }
      >
        <ClaimCard />

        <Card>
          <Text className="text-ink-mute text-xs mb-3 tracking-widest">
            TOTAL CLAIMED (ALL TIME)
          </Text>
          <View className="flex-row flex-wrap gap-y-3">
            {RESOURCES.map((k) => (
              <View key={k} className="w-1/2 flex-row items-center gap-2">
                <Text style={{ fontSize: 22 }}>{RESOURCE_EMOJI[k]}</Text>
                <View>
                  <Text style={{ color: RESOURCE_COLOR[k], fontWeight: "700", fontSize: 18 }}>
                    {fmtNum(totalClaimed[k])}
                  </Text>
                  <Text className="text-ink-mute text-[10px] uppercase tracking-wider">
                    {RESOURCE_LABEL[k]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text className="text-ink-mute text-xs mb-3 tracking-widest">
            HISTORY ({history.length})
          </Text>
          {history.length === 0 ? (
            <Text className="text-ink-dim">No claims yet — your first claim will appear here.</Text>
          ) : (
            history.map((h, i) => (
              <View
                key={i}
                className={`py-3 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <Text className="text-ink-dim text-xs mb-1">
                  {new Date(h.at).toLocaleString()} • {fmtNum(h.hours)}h
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {RESOURCES.map((k) => {
                    const v = h.cappedAt[k] ?? 0;
                    if (v <= 0) return null;
                    return (
                      <View key={k} className="flex-row items-center gap-1">
                        <Text>{RESOURCE_EMOJI[k]}</Text>
                        <Text className="text-ink" style={{ fontWeight: "600" }}>
                          +{fmtNum(v)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
