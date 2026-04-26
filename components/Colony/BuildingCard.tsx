import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMemo } from "react";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import {
  BUILDINGS,
  RESOURCE_COLOR,
  RESOURCE_EMOJI,
  RESOURCE_LABEL,
} from "@/constants/buildings";
import { fmtNum } from "@/lib/format";
import {
  buildingProductionPerHour,
  canAfford,
  upgradeCost,
} from "@/lib/colonyMath";
import { haptic } from "@/lib/haptics";
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <Pressable className="mt-auto" onPress={(e) => e.stopPropagation()}>
          <View className="rounded-t-3xl bg-bg-elevated p-5 pb-8 border-t border-border">
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

  return (
    <View>
      <Text className="text-ink text-xl font-semibold mb-1">Build new</Text>
      <Text className="text-ink-dim mb-4">
        Choose a building to place in this slot.
      </Text>
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
          return (
            <Card key={k} className="mb-3">
              <View className="flex-row items-center mb-2">
                <Text style={{ fontSize: 28 }}>{def.emoji}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-ink font-semibold">{def.name}</Text>
                  <Text className="text-ink-dim text-xs">
                    {def.description}
                  </Text>
                </View>
              </View>
              <View className="mb-3">
                <Text className="text-ink-mute text-xs mb-1">PRODUCTION</Text>
                {def.produces ? (
                  <Text className="text-ink">
                    {RESOURCE_EMOJI[def.produces]}{" "}
                    {fmtNum(def.baseProductionPerHour)} {RESOURCE_LABEL[def.produces]} / hr
                  </Text>
                ) : def.researchBoostPerLevel ? (
                  <Text className="text-ink">
                    +{def.researchBoostPerLevel * 100}% colony production / level
                  </Text>
                ) : def.storageBonusPerLevel ? (
                  <Text className="text-ink">
                    +{def.storageBonusPerLevel} max cap / level
                  </Text>
                ) : null}
              </View>
              <View className="mb-3">
                <Text className="text-ink-mute text-xs mb-1">COST</Text>
                <ResourceCostRow cost={cost} resources={resources} />
              </View>
              <Button
                label={ok ? "Build" : "Not enough resources"}
                variant={ok ? "primary" : "secondary"}
                disabled={!ok}
                onPress={() => {
                  if (place(slotIndex, k)) {
                    haptic.build();
                    onClose();
                  } else {
                    haptic.error();
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
        label="Cancel"
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

  const isMax = building.level >= def.maxLevel;
  const cost = isMax
    ? null
    : (upgradeCost(building.kind, building.level) as Record<string, number>);
  const ok = cost ? canAfford(resources, cost) : false;
  const prod = buildingProductionPerHour(building);
  const skinUnlocked = building.level >= def.skinUnlockLevel;

  return (
    <View>
      <View className="flex-row items-center mb-2">
        <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
        <View className="ml-3 flex-1">
          <Text className="text-ink text-xl font-semibold">{def.name}</Text>
          <Text className="text-ink-dim text-xs">
            Level {building.level}{isMax ? " (max)" : ""}
            {building.skinMint ? "  •  ✨ skinned" : ""}
          </Text>
        </View>
      </View>
      <Text className="text-ink-dim mb-4">{def.description}</Text>

      <Card className="mb-3">
        <Text className="text-ink-mute text-xs mb-1">CURRENT PRODUCTION</Text>
        {prod.resource ? (
          <Text className="text-ink">
            {RESOURCE_EMOJI[prod.resource]} {fmtNum(prod.amount)}{" "}
            {RESOURCE_LABEL[prod.resource]} / hr
          </Text>
        ) : def.researchBoostPerLevel ? (
          <Text className="text-ink">
            +{(def.researchBoostPerLevel * building.level * 100).toFixed(0)}%
            global production
          </Text>
        ) : def.storageBonusPerLevel ? (
          <Text className="text-ink">
            +{def.storageBonusPerLevel * building.level} max cap
          </Text>
        ) : null}
      </Card>

      {!isMax ? (
        <Card className="mb-3">
          <Text className="text-ink-mute text-xs mb-1">UPGRADE COST</Text>
          {cost ? (
            <ResourceCostRow cost={cost} resources={resources} />
          ) : null}
        </Card>
      ) : null}

      <View className="flex-row gap-3">
        {!isMax ? (
          <View className="flex-1">
            <Button
              label={ok ? `Upgrade to ${building.level + 1}` : "Need resources"}
              disabled={!ok}
              onPress={() => {
                if (upgrade(slotIndex)) {
                  haptic.upgrade();
                  onClose();
                } else {
                  haptic.error();
                }
              }}
            />
          </View>
        ) : null}
        <Button
          variant="secondary"
          label={skinUnlocked ? "Mint Skin" : `Skin @ L${def.skinUnlockLevel}`}
          disabled={!skinUnlocked}
          onPress={() => {
            // navigation handled by caller via deep-link;
            // for simplicity here we just close so the user can press Mint tab.
            onClose();
          }}
        />
      </View>

      <Button
        className="mt-3"
        variant="ghost"
        label="Demolish"
        onPress={() => {
          haptic.demolish();
          demolish(slotIndex);
          onClose();
        }}
      />
      <Button
        className="mt-2"
        variant="ghost"
        label="Close"
        onPress={onClose}
      />
    </View>
  );
}
