import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { AnimatedResource } from "@/components/UI/AnimatedResource";
import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { Grid } from "@/components/Colony/Grid";
import { useColonyData } from "@/hooks/useColonyData";
import { useDailyClaim } from "@/hooks/useDailyClaim";
import { fmtNum } from "@/lib/format";
import { RESOURCE_EMOJI } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

const RESOURCES: ResourceKind[] = ["honey", "energy", "food", "water"];

export default function ColonyScreen() {
  const { resources, perHour, pending, storageCap, researchBoost } =
    useColonyData();
  const { canClaim, remainingLabel, doClaim, cooldownHours } = useDailyClaim();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text className="text-ink-mute text-xs mb-3 tracking-widest">
            RESOURCES
          </Text>
          <View className="flex-row flex-wrap gap-y-3">
            {RESOURCES.map((k) => (
              <View key={k} className="w-1/2">
                <AnimatedResource
                  kind={k}
                  value={resources[k]}
                  pending={pending.produced[k]}
                  cap={storageCap}
                />
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <View className="flex-row justify-between mb-2">
            <Text className="text-ink-mute text-xs tracking-widest">
              PRODUCTION
            </Text>
            {researchBoost > 0 ? (
              <Text className="text-accent text-xs">
                +{(researchBoost * 100).toFixed(0)}% research bonus
              </Text>
            ) : null}
          </View>
          <View className="flex-row flex-wrap gap-y-2">
            {RESOURCES.map((k) => (
              <View key={k} className="w-1/2 flex-row items-center gap-2">
                <Text>{RESOURCE_EMOJI[k]}</Text>
                <Text className="text-ink">
                  {fmtNum(perHour[k])} <Text className="text-ink-dim">/hr</Text>
                </Text>
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

        <Card>
          <Text className="text-ink-mute text-xs mb-2 tracking-widest">
            DAILY CLAIM
          </Text>
          <Text className="text-ink mb-3">
            Pending: {fmtNum(pending.hours)} hrs of accumulation
          </Text>
          <Button
            label={canClaim ? "Claim Rewards" : `Cooldown ${remainingLabel}`}
            disabled={!canClaim}
            onPress={() => doClaim()}
          />
          <Text className="text-ink-mute text-xs mt-2">
            Claim every {cooldownHours}h. Max accumulation 48h.
          </Text>
          <Link href="/rewards" asChild>
            <Button label="View claim history" variant="ghost" />
          </Link>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
