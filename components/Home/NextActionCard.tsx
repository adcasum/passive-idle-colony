import { Link } from "expo-router";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { getBuildingName } from "@/constants/buildings";
import { useNextAction } from "@/hooks/useNextAction";
import type { BuildingKind } from "@/types";

const KEY_TO_I18N: Record<string, string> = {
  first_hive: "home.next_action_first_hive",
  solar: "home.next_action_solar",
  food: "home.next_action_food",
  water: "home.next_action_water",
  claim: "home.next_action_claim",
  storage_full: "home.next_action_storage_full",
  upgrade: "home.next_action_upgrade",
  idle: "home.next_action_idle",
};

const KEY_TO_CTA: Record<string, string> = {
  first_hive: "home.step_build_cta",
  solar: "home.step_build_cta",
  food: "home.step_build_cta",
  water: "home.step_build_cta",
  claim: "claim.claim_button",
  storage_full: "home.step_build_cta",
  upgrade: "home.step_build_cta",
  idle: "home.step_build_cta",
};

/**
 * Always-visible "what to do next" coach. Reads from `useNextAction`
 * which encodes a strict priority order, so the player only ever sees
 * the single highest-impact suggestion.
 */
export function NextActionCard() {
  const { t } = useTranslation();
  const action = useNextAction();
  const i18nKey = KEY_TO_I18N[action.key];
  const ctaKey = KEY_TO_CTA[action.key];

  let renderedValues = action.values;
  if (action.key === "upgrade" && action.values) {
    const kind = action.values.name as BuildingKind;
    renderedValues = {
      ...action.values,
      name: t(getBuildingName(kind)),
    };
  }

  const sentence = t(i18nKey, renderedValues ?? {});

  const cta =
    action.href === "/colony" ||
    action.href === "/rewards" ||
    action.href === "/mint" ? (
      <Link href={action.href} asChild>
        <Button label={t(ctaKey)} variant="primary" />
      </Link>
    ) : null;

  return (
    <Card>
      <View className="flex-row items-center mb-2">
        <Text className="text-accent text-xs font-bold tracking-widest uppercase">
          ★ {t("home.next_action_title")}
        </Text>
      </View>
      <Text className="text-ink text-base mb-3" numberOfLines={3}>
        {sentence}
      </Text>
      {cta}
    </Card>
  );
}
