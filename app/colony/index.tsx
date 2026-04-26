import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";

import { ClaimCard } from "@/components/Colony/ClaimCard";
import { ColonyHeader } from "@/components/Colony/ColonyHeader";
import { Grid } from "@/components/Colony/Grid";
import { Card } from "@/components/UI/Card";
import { HoneycombPattern } from "@/components/UI/HoneycombPattern";
import { useColonyData } from "@/hooks/useColonyData";
import { useColonyStore } from "@/store/colonyStore";
import { fmtNum } from "@/lib/format";
import { RESOURCE_COLOR, RESOURCE_EMOJI } from "@/constants/buildings";
import type { ResourceKind } from "@/types";

const RESOURCES: ResourceKind[] = ["honey", "energy", "food", "water"];

export default function ColonyScreen() {
  const { resources, perHour, pending, storageCap, researchBoost } =
    useColonyData();
  const slots = useColonyStore((s) => s.slots);
  const allEmpty = slots.every((s) => s === null);
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <HoneycombPattern />
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
              {t("build_picker.current_production_label")}
            </Text>
            {researchBoost > 0 ? (
              <View className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40">
                <Text className="text-accent text-[10px] font-semibold">
                  {t("build_picker.current_research", {
                    percent: (researchBoost * 100).toFixed(0),
                  })}
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
                    {t(`resources.${k}`)}{t("header.production_per_hour")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-ink text-lg font-semibold">{t("colony.title")}</Text>
            <Text className="text-ink-mute text-[10px] tracking-widest">
              {t("colony.built_count", {
                built: slots.filter((s) => s !== null).length,
                total: 9,
              })}
            </Text>
          </View>
          {allEmpty ? (
            <View className="mb-3 px-3 py-3 rounded-xl bg-accent/10 border border-accent/30">
              <Text className="text-accent font-semibold mb-1">
                {t("colony.empty_hint_title")}
              </Text>
              <Text className="text-ink-dim text-xs">
                {t("colony.empty_hint_body")}
              </Text>
            </View>
          ) : null}
          <Grid />
        </Card>

        <Link href="/rewards" asChild>
          <Text className="text-accent text-center underline mt-1">
            {t("home.rewards_button")}
          </Text>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
