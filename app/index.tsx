import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { WalletConnectButton } from "@/components/Shared/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { connected } = useWallet();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
        <Hero />

        <Card>
          <Text className="text-ink-dim text-xs mb-2 tracking-widest">
            STEP 1
          </Text>
          <Text className="text-ink text-lg font-semibold mb-3">
            Connect your Solana Mobile wallet
          </Text>
          <Text className="text-ink-dim mb-4">
            Sign in once with Seed Vault. Your colony state is tied to your
            wallet.
          </Text>
          <WalletConnectButton />
        </Card>

        <Card>
          <Text className="text-ink-dim text-xs mb-2 tracking-widest">
            STEP 2
          </Text>
          <Text className="text-ink text-lg font-semibold mb-2">
            Build your colony
          </Text>
          <Text className="text-ink-dim mb-4">
            Place buildings on a 3×3 grid. They produce honey, energy, food and
            water — even when the app is closed.
          </Text>
          <Link href="/colony" asChild>
            <Button label="Open Colony" variant="primary" disabled={!connected} />
          </Link>
        </Card>

        <Card>
          <Text className="text-ink-dim text-xs mb-2 tracking-widest">
            STEP 3
          </Text>
          <Text className="text-ink text-lg font-semibold mb-2">
            Claim daily rewards
          </Text>
          <Text className="text-ink-dim mb-4">
            Resources accumulate up to 48 hours. Claim every 12+ hours and
            unlock unique cNFT skins as you upgrade buildings.
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Link href="/rewards" asChild>
                <Button
                  label="Rewards"
                  variant="secondary"
                  disabled={!connected}
                />
              </Link>
            </View>
            <View className="flex-1">
              <Link href="/mint" asChild>
                <Button label="Skins" variant="secondary" disabled={!connected} />
              </Link>
            </View>
          </View>
        </Card>

        <View className="items-center mt-2">
          <Link href="/profile" asChild>
            <Button label="Profile" variant="ghost" />
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Hero() {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [float]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -float.value * 6 }],
  }));

  return (
    <View className="items-center pt-6">
      <Animated.Text style={[heroStyle, { fontSize: 80 }]}>🐝</Animated.Text>
      <Text className="text-ink text-3xl font-bold mt-2">Passive Idle Colony</Text>
      <Text className="text-ink-dim text-center mt-1 px-6">
        A cozy idle game on Solana. Build, claim, mint.
      </Text>
    </View>
  );
}
