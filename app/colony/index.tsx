import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { ClaimCard } from "@/components/Colony/ClaimCard";
import { ColonyHeader } from "@/components/Colony/ColonyHeader";
import { Grid } from "@/components/Colony/Grid";
import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { useColonyData } from "@/hooks/useColonyData";
import { fmtNum } from "@/lib/format";
import { RESOURCE_COLOR, RESOURCE_EMOJI, RESOURCE_LABEL } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

const RESOURCES: ResourceKind[] = ["honey", "energy", "food", "water"];

export default function ColonyScreen() {
  const { resources, perHour, pending, storageCap, researchBoost } =
    useColonyData();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ColonyHeader
        resources={resources}
        pending={pending.produced}
        storageCap={storageCap}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <ClaimCard />

        <Card>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-ink-mute text-xs tracking-widest">
              PRODUCTION / HR
            </Text>
            {researchBoost > 0 ? (
              <View className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40">
                <Text className="text-accent text-[10px] font-semibold">
                  +{(researchBoost * 100).toFixed(0)}% research
                </Text>
              </View>
            ) : null}
          </View>
          <View className="flex-row flex-wrap gap-y-2">
            {RESOURCES.map((k) => (
              <View key={k} className="w-1/2 flex-row items-center gap-2">
                <Text style={{ fontSize: 18 }}>{RESOURCE_EMOJI[k]}</Text>
                <View>
                  <Text style={{ color: RESOURCE_COLOR[k], fontWeight: "700" }}>
                    +{fmtNum(perHour[k])}
                  </Text>
                  <Text className="text-ink-mute text-[10px] uppercase tracking-wider">
                    {RESOURCE_LABEL[k]}/hr
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text className="text-ink text-lg font-semibold mb-3">Colony</Text>
          <Grid />
          <Text className="text-ink-mute text-xs mt-3">
            Tap empty slot to build • tap building to upgrade or mint skin
          </Text>
        </Card>

        <Link href="/rewards" asChild>
          <Button label="View claim history" variant="ghost" />
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
