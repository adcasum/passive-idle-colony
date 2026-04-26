import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { BUILDINGS } from "@/constants/buildings";
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

  const eligible: { idx: number; b: Building }[] = [];
  slots.forEach((s, i) => {
    if (!s) return;
    const def = BUILDINGS[s.kind];
    if (s.level >= def.skinUnlockLevel) eligible.push({ idx: i, b: s });
  });

  const handleMint = async (idx: number, b: Building) => {
    if (!connected) {
      Alert.alert(
        "Wallet required",
        "Connect a Solana Mobile wallet first to receive the cNFT skin.",
      );
      return;
    }
    const result = await mint(idx, b);
    if (result) {
      Alert.alert(
        "Skin minted!",
        result.onChain
          ? `cNFT minted on-chain.\n\n${ellipsify(result.mint, 6, 6)}`
          : `Skin equipped (local). On-chain mint will activate once a Bubblegum tree is configured.`,
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text className="text-ink text-lg font-semibold mb-1">
            Cosmetic Skins (cNFT)
          </Text>
          <Text className="text-ink-dim mb-2">
            Compressed NFTs you collect for upgraded buildings. Each skin grants
            a +5–15% production bonus and is stored in your Seed Vault wallet.
          </Text>
          <Text className="text-ink-mute text-xs">
            Mode: {BUBBLEGUM_TREE ? "On-chain (Bubblegum)" : "Local placeholder"}
          </Text>
        </Card>

        {eligible.length === 0 ? (
          <Card>
            <Text className="text-ink-dim">
              No buildings eligible yet. Upgrade a building to its skin-unlock
              level (typically L3) to mint a skin.
            </Text>
          </Card>
        ) : (
          eligible.map(({ idx, b }) => {
            const def = BUILDINGS[b.kind];
            return (
              <Card key={idx}>
                <View className="flex-row items-center mb-3">
                  <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
                  <View className="ml-3 flex-1">
                    <Text className="text-ink font-semibold">{def.name}</Text>
                    <Text className="text-ink-dim text-xs">
                      Level {b.level}
                      {b.skinMint
                        ? `  •  Equipped: ${ellipsify(b.skinMint, 4, 4)}`
                        : "  •  No skin"}
                    </Text>
                  </View>
                </View>
                <Text className="text-ink-dim mb-3">
                  Bonus: +{(def.skinBonus * 100).toFixed(0)}% to{" "}
                  {def.produces ?? "this building's effect"}.
                </Text>
                <Button
                  label={
                    b.skinMint
                      ? "Re-mint (replaces current)"
                      : minting
                        ? "Minting..."
                        : "Mint Unique Skin"
                  }
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
