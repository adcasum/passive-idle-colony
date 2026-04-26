import { Link } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/UI/Button";
import { Card, GradientCard } from "@/components/UI/Card";
import { WalletConnectButton } from "@/components/Shared/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";

const HERO_GRADIENT: [string, string] = ["#1A1233", "#0B0F1A"];

export default function Home() {
  const { connected } = useWallet();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Hero />

        <Step
          n={1}
          title="Connect your wallet"
          body="Sign in once with Seed Vault. Your colony state is tied to your wallet."
        >
          <WalletConnectButton />
        </Step>

        <Step
          n={2}
          title="Build your colony"
          body="Place buildings on a 3×3 grid. They produce honey, energy, food and water — even when the app is closed."
        >
          <Link href="/colony" asChild>
            <Button label="Open Colony" variant="primary" disabled={!connected} />
          </Link>
        </Step>

        <Step
          n={3}
          title="Claim daily rewards"
          body="Resources accumulate up to 48 hours. Claim every 12 hours and unlock unique cNFT skins as you upgrade buildings."
        >
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Link href="/rewards" asChild>
                <Button label="Rewards" variant="secondary" disabled={!connected} />
              </Link>
            </View>
            <View className="flex-1">
              <Link href="/mint" asChild>
                <Button label="Skins" variant="secondary" disabled={!connected} />
              </Link>
            </View>
          </View>
        </Step>

        <View className="flex-row gap-3 mt-2">
          <View className="flex-1">
            <Link href="/leaderboard" asChild>
              <Button label="Leaderboard" variant="ghost" />
            </Link>
          </View>
          <View className="flex-1">
            <Link href="/profile" asChild>
              <Button label="Profile" variant="ghost" />
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({
  n,
  title,
  body,
  children,
}: {
  n: number;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View className="flex-row items-center mb-2">
        <View className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 items-center justify-center">
          <Text className="text-accent text-[11px] font-bold">{n}</Text>
        </View>
        <Text className="text-ink text-lg font-semibold ml-2">{title}</Text>
      </View>
      <Text className="text-ink-dim mb-4">{body}</Text>
      {children}
    </Card>
  );
}

function Hero() {
  return (
    <GradientCard colors={HERO_GRADIENT} className="items-center pt-6 pb-8">
      <FloatingBees />
      <FloatingHeroBee />
      <Text className="text-ink text-3xl font-bold mt-2">
        Passive Idle Colony
      </Text>
      <Text className="text-ink-dim text-center mt-1 px-6">
        A cozy idle game on Solana.{"\n"}Build, claim, mint.
      </Text>
    </GradientCard>
  );
}

function FloatingHeroBee() {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [float]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -float.value * 8 }],
  }));

  return <Animated.Text style={[heroStyle, { fontSize: 80 }]}>🐝</Animated.Text>;
}

function FloatingBees() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4 }}
    >
      <BackgroundBee delay={0} top={20} left={"15%"} duration={5200} />
      <BackgroundBee delay={1800} top={50} left={"75%"} duration={4400} />
      <BackgroundBee delay={3200} top={80} left={"40%"} duration={5800} />
    </View>
  );
}

function BackgroundBee({
  delay,
  top,
  left,
  duration,
}: {
  delay: number;
  top: number;
  left: `${number}%` | number;
  duration: number;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    tx.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    ty.value = withDelay(
      delay + 200,
      withRepeat(
        withTiming(1, { duration: duration * 0.7, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, tx, ty]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value * 30 - 15 },
      { translateY: ty.value * 14 - 7 },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute", top, left }, style]}>
      <Text style={{ fontSize: 16 }}>🐝</Text>
    </Animated.View>
  );
}
