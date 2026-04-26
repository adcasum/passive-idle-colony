import * as Clipboard from "expo-clipboard";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { WalletConnectButton } from "@/components/Shared/WalletConnectButton";
import { useColonyStore } from "@/store/colonyStore";
import { useRewardsStore } from "@/store/rewardsStore";
import { useWallet } from "@/hooks/useWallet";
import { CLUSTER, RPC_URL } from "@/lib/solana";
import { ellipsify, fmtNum } from "@/lib/format";

export default function ProfileScreen() {
  const { address, solBalance, balanceLoading } = useWallet();
  const resetColony = useColonyStore((s) => s.reset);
  const resetRewards = useRewardsStore((s) => s.reset);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text className="text-ink text-lg font-semibold mb-3">Wallet</Text>
          <WalletConnectButton />
          {address ? (
            <View className="mt-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">Address</Text>
                <Text
                  className="text-ink"
                  onPress={() => {
                    Clipboard.setStringAsync(address);
                    Alert.alert("Copied", address);
                  }}
                >
                  {ellipsify(address, 6, 6)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">SOL balance</Text>
                <Text className="text-ink">
                  {balanceLoading
                    ? "…"
                    : solBalance !== null
                      ? `${fmtNum(solBalance)} SOL`
                      : "—"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">Network</Text>
                <Text className="text-ink">{CLUSTER}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">RPC</Text>
                <Text className="text-ink-dim text-xs">
                  {ellipsify(RPC_URL, 18, 14)}
                </Text>
              </View>
            </View>
          ) : null}
        </Card>

        <Card>
          <Text className="text-ink text-lg font-semibold mb-3">Danger zone</Text>
          <Text className="text-ink-dim mb-3">
            Reset wipes only local state (resources, buildings, claim history).
            cNFT skins on-chain remain in your wallet.
          </Text>
          <Button
            variant="danger"
            label="Reset colony"
            onPress={() => {
              Alert.alert("Reset colony?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reset",
                  style: "destructive",
                  onPress: () => {
                    resetColony();
                    resetRewards();
                  },
                },
              ]);
            }}
          />
        </Card>

        <Card>
          <Text className="text-ink text-lg font-semibold mb-2">About</Text>
          <Text className="text-ink-dim">
            Passive Idle Colony — a cozy idle dApp built for the Solana Mobile
            dApp Store. Open-source MVP.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
