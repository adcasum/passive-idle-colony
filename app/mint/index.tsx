import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { BUILDINGS, getBuildingName } from "@/constants/buildings";
import { useColonyStore } from "@/store/colonyStore";
import { useMintSkin } from "@/hooks/useMintSkin";
import { useWallet } from "@/hooks/useWallet";
import { ellipsify } from "@/lib/format";
import { BUBBLEGUM_TREE } from "@/lib/metaplex";
import type { Building } from "@/types";

export default function MintScreen() {
  const slots = useColonyStore((s) => s.slots);
  const { mint, minting } = useMintSkin();
  const { connected } = useWallet();
  const { t } = useTranslation();

  const eligible: { idx: number; b: Building }[] = [];
  slots.forEach((s, i) => {
    if (!s) return;
    const def = BUILDINGS[s.kind];
    if (s.level >= def.skinUnlockLevel) eligible.push({ idx: i, b: s });
  });

  const handleMint = async (idx: number, b: Building) => {
    if (!connected) {
      Alert.alert(t("errors.wallet_required"), t("wallet.description"));
      return;
    }
    const result = await mint(idx, b);
    if (result) {
      Alert.alert(
        t("toast.skin_minted"),
        result.onChain
          ? `${t("mint.minted_chain")}\n\n${ellipsify(result.mint, 6, 6)}`
          : t("mint.minted_local"),
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text className="text-ink text-lg font-semibold mb-1">
            {t("mint.title")}
          </Text>
          <Text className="text-ink-dim mb-2">{t("mint.intro")}</Text>
          <Text className="text-ink-mute text-xs">
            Mode: {BUBBLEGUM_TREE ? "On-chain (Bubblegum)" : "Local placeholder"}
          </Text>
        </Card>

        {eligible.length === 0 ? (
          <Card>
            <Text className="text-ink-dim">{t("mint.no_eligible")}</Text>
          </Card>
        ) : (
          eligible.map(({ idx, b }) => {
            const def = BUILDINGS[b.kind];
            const name = t(getBuildingName(b.kind));
            return (
              <Card key={idx}>
                <View className="flex-row items-center mb-3">
                  <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
                  <View className="ml-3 flex-1">
                    <Text className="text-ink font-semibold">{name}</Text>
                    <Text className="text-ink-dim text-xs">
                      {t("build_picker.level_label", { level: b.level })}
                      {b.skinMint
                        ? `  •  ${t("mint.current_skin", { id: ellipsify(b.skinMint, 4, 4) })}`
                        : `  •  ${t("mint.no_skin_yet")}`}
                    </Text>
                  </View>
                </View>
                <Button
                  label={minting ? t("mint.minting") : t("mint.mint_button")}
                  loading={minting}
                  onPress={() => handleMint(idx, b)}
                />
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
