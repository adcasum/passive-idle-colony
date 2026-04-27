import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import {
  BUILDINGS,
  RESOURCE_COLOR,
  RESOURCE_EMOJI,
  getBuildingDesc,
  getBuildingName,
} from "@/constants/buildings";
import { fmtNum } from "@/lib/format";
import {
  buildingProductionPerHour,
  canAfford,
  upgradeCost,
} from "@/lib/colonyMath";
import { onBuilt, onUpgraded } from "@/lib/engagementEvents";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/toast";
import { useColonyStore } from "@/store/colonyStore";
import type { Building, BuildingKind, ResourceKind } from "@/types";

interface Props {
  visible: boolean;
  slotIndex: number;
  /** When set, edit existing; when null, build new. */
  building: Building | null;
  onClose: () => void;
}

export function BuildingCard({ visible, slotIndex, building, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop fades in via a separate fade Modal-less view; the content
          slides up via the Modal's own slide animation. The Pressable on the
          backdrop only catches taps that aren't on the sheet itself. */}
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <Pressable className="mt-auto" onPress={(e) => e.stopPropagation()}>
          <View className="rounded-t-3xl bg-bg-elevated px-5 pt-3 pb-8 border-t border-border-strong">
            {/* Drag handle */}
            <View className="items-center mb-3">
              <View
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#5A4220",
                }}
              />
            </View>
            {building ? (
              <ExistingBuilding
                building={building}
                slotIndex={slotIndex}
                onClose={onClose}
              />
            ) : (
              <BuildPicker slotIndex={slotIndex} onClose={onClose} />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ResourceCostRow({
  cost,
  resources,
}: {
  cost: Record<string, number>;
  resources: Record<string, number>;
}) {
  return (
    <View className="flex-row gap-3 flex-wrap">
      {(Object.keys(cost) as ResourceKind[]).map((k) => {
        const need = cost[k] ?? 0;
        if (!need) return null;
        const have = resources[k] ?? 0;
        const ok = have >= need;
        return (
          <View key={k} className="flex-row items-center gap-1">
            <Text>{RESOURCE_EMOJI[k]}</Text>
            <Text style={{ color: ok ? RESOURCE_COLOR[k] : "#EF4444" }}>
              {fmtNum(need)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function BuildPicker({
  slotIndex,
  onClose,
}: {
  slotIndex: number;
  onClose: () => void;
}) {
  const place = useColonyStore((s) => s.placeBuilding);
  const resources = useColonyStore((s) => s.resources);
  const kinds = useMemo(() => Object.keys(BUILDINGS) as BuildingKind[], []);
  const { t } = useTranslation();

  return (
    <View>
      <Text className="text-ink text-xl font-semibold mb-1">
        {t("build_picker.title")}
      </Text>
      <Text className="text-ink-dim mb-4">{t("build_picker.subtitle")}</Text>
      <ScrollView style={{ maxHeight: 420 }}>
        {kinds.map((k) => {
          const def = BUILDINGS[k];
          const cost: Record<string, number> = {
            honey: def.baseCost.honey ?? 0,
            energy: def.baseCost.energy ?? 0,
            food: def.baseCost.food ?? 0,
            water: def.baseCost.water ?? 0,
          };
          const ok = canAfford(resources, cost);
          const name = t(getBuildingName(k));
          return (
            <Card key={k} className="mb-3">
              <View className="flex-row items-center mb-2">
                <Text style={{ fontSize: 28 }}>{def.emoji}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-ink font-semibold">{name}</Text>
                  <Text className="text-ink-dim text-xs">
                    {t(getBuildingDesc(k))}
                  </Text>
                </View>
              </View>
              <View className="mb-3">
                <Text className="text-ink-mute text-xs mb-1">
                  {t("build_picker.production_label")}
                </Text>
                {def.produces ? (
                  <Text className="text-ink">
                    {RESOURCE_EMOJI[def.produces]}{" "}
                    {fmtNum(def.baseProductionPerHour)}{" "}
                    {t(`resources.${def.produces}`)}
                    {t("header.production_per_hour")}
                  </Text>
                ) : def.researchBoostPerLevel ? (
                  <Text className="text-ink">
                    {t("build_picker.production_research", {
                      percent: def.researchBoostPerLevel * 100,
                    })}
                  </Text>
                ) : def.storageBonusPerLevel ? (
                  <Text className="text-ink">
                    {t("build_picker.production_storage", {
                      cap: def.storageBonusPerLevel,
                    })}
                  </Text>
                ) : null}
              </View>
              <View className="mb-3">
                <Text className="text-ink-mute text-xs mb-1">
                  {t("build_picker.cost_label")}
                </Text>
                <ResourceCostRow cost={cost} resources={resources} />
              </View>
              <Button
                label={ok ? t("build_picker.build_button") : t("build_picker.not_enough")}
                variant={ok ? "primary" : "secondary"}
                disabled={!ok}
                onPress={() => {
                  if (place(slotIndex, k)) {
                    haptic.build();
                    onBuilt();
                    toast.success(t("toast.built", { name }));
                    onClose();
                  } else {
                    haptic.error();
                    toast.error(t("toast.not_enough_resources"));
                  }
                }}
              />
            </Card>
          );
        })}
      </ScrollView>
      <Button
        className="mt-2"
        variant="ghost"
        label={t("common.cancel")}
        onPress={onClose}
      />
    </View>
  );
}

function ExistingBuilding({
  building,
  slotIndex,
  onClose,
}: {
  building: Building;
  slotIndex: number;
  onClose: () => void;
}) {
  const def = BUILDINGS[building.kind];
  const upgrade = useColonyStore((s) => s.upgrade);
  const demolish = useColonyStore((s) => s.demolish);
  const resources = useColonyStore((s) => s.resources);
  const { t } = useTranslation();

  const isMax = building.level >= def.maxLevel;
  const cost = isMax
    ? null
    : (upgradeCost(building.kind, building.level) as Record<string, number>);
  const ok = cost ? canAfford(resources, cost) : false;
  const prod = buildingProductionPerHour(building);
  const skinUnlocked = building.level >= def.skinUnlockLevel;
  const name = t(getBuildingName(building.kind));

  return (
    <View>
      <View className="flex-row items-center mb-2">
        <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
        <View className="ml-3 flex-1">
          <Text className="text-ink text-xl font-semibold">{name}</Text>
          <Text className="text-ink-dim text-xs">
            {t("build_picker.level_label", { level: building.level })}
            {isMax ? ` ${t("build_picker.max_level")}` : ""}
            {building.skinMint ? `  •  ${t("build_picker.skinned_badge")}` : ""}
          </Text>
        </View>
      </View>
      <Text className="text-ink-dim mb-4">{t(getBuildingDesc(building.kind))}</Text>

      <Card className="mb-3">
        <Text className="text-ink-mute text-xs mb-1">
          {t("build_picker.current_production_label")}
        </Text>
        {prod.resource ? (
          <Text className="text-ink">
            {RESOURCE_EMOJI[prod.resource]} {fmtNum(prod.amount)}{" "}
            {t(`resources.${prod.resource}`)}
            {t("header.production_per_hour")}
          </Text>
        ) : def.researchBoostPerLevel ? (
          <Text className="text-ink">
            {t("build_picker.current_research", {
              percent: (def.researchBoostPerLevel * building.level * 100).toFixed(0),
            })}
          </Text>
        ) : def.storageBonusPerLevel ? (
          <Text className="text-ink">
            {t("build_picker.current_storage", {
              cap: def.storageBonusPerLevel * building.level,
            })}
          </Text>
        ) : null}
      </Card>

      {!isMax ? (
        <Card className="mb-3">
          <Text className="text-ink-mute text-xs mb-1">
            {t("build_picker.upgrade_cost_label")}
          </Text>
          {cost ? (
            <ResourceCostRow cost={cost} resources={resources} />
          ) : null}
        </Card>
      ) : null}

      <View className="flex-row gap-3">
        {!isMax ? (
          <View className="flex-1">
            <Button
              label={
                ok
                  ? t("build_picker.upgrade_button", { level: building.level + 1 })
                  : t("toast.not_enough_resources")
              }
              disabled={!ok}
              onPress={() => {
                if (upgrade(slotIndex)) {
                  haptic.upgrade();
                  onUpgraded();
                  toast.success(
                    t("toast.upgraded", { name, level: building.level + 1 }),
                  );
                  onClose();
                } else {
                  haptic.error();
                  toast.error(t("toast.not_enough_resources"));
                }
              }}
            />
          </View>
        ) : null}
        <Button
          variant="secondary"
          label={
            skinUnlocked
              ? t("build_picker.skin_unlocked")
              : t("build_picker.skin_locked", { level: def.skinUnlockLevel })
          }
          disabled={!skinUnlocked}
          onPress={() => {
            onClose();
          }}
        />
      </View>

      <Button
        className="mt-3"
        variant="ghost"
        label={t("build_picker.demolish_button")}
        onPress={() => {
          haptic.demolish();
          demolish(slotIndex);
          toast.info(t("toast.demolished", { name }));
          onClose();
        }}
      />
      <Button
        className="mt-2"
        variant="ghost"
        label={t("common.close")}
        onPress={onClose}
      />
    </View>
  );
}
