import { Alert, Text, View } from "react-native";

import { Button } from "@/components/UI/Button";
import { ellipsify } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";

export function WalletConnectButton() {
  const { connected, address, loading, connect, disconnect } = useWallet();

  const handle = async () => {
    try {
      if (connected) {
        await disconnect();
      } else {
        await connect();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("Wallet error", msg);
    }
  };

  if (!connected) {
    return (
      <Button
        label={loading ? "Connecting..." : "Connect Wallet"}
        loading={loading}
        onPress={handle}
        size="lg"
      />
    );
  }

  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-bg-card px-4 py-3">
      <View>
        <Text className="text-ink-mute text-xs">Connected</Text>
        <Text className="text-ink font-semibold">
          {address ? ellipsify(address, 6, 6) : "—"}
        </Text>
      </View>
      <Button label="Disconnect" variant="secondary" size="sm" onPress={handle} />
    </View>
  );
}
