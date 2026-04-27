import { Link } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { BloomBanner } from "@/components/Home/BloomBanner";
import { NarrativeHero } from "@/components/Home/NarrativeHero";
import { NextActionCard } from "@/components/Home/NextActionCard";
import { QuestList } from "@/components/Home/QuestList";
import { StreakBadge } from "@/components/Home/StreakBadge";
import { Button } from "@/components/UI/Button";
import { Card, GradientCard } from "@/components/UI/Card";
import { HoneycombPattern } from "@/components/UI/HoneycombPattern";
import { WalletConnectButton } from "@/components/Shared/WalletConnectButton";
import { useLoginStreak } from "@/hooks/useLoginStreak";
import { useStorageWarning } from "@/hooks/useStorageWarning";
import { useWallet } from "@/hooks/useWallet";

const HERO_GRADIENT: [string, string] = ["#3D2A0E", "#1A140A"];

export default function Home() {
  const { connected } = useWallet();
  const { t } = useTranslation();

  // Side-effects: record today's login + maybe surface storage-full warn.
  // Both are idempotent within a single local day.
  useLoginStreak();
  useStorageWarning();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <HoneycombPattern />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {connected ? (
          <>
            <NarrativeHero />
            <BloomBanner />
            <NextActionCard />
            <StreakBadge />
            <QuestList />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Link href="/colony" asChild>
                  <Button label={t("home.step_build_cta")} variant="primary" />
                </Link>
              </View>
              <View className="flex-1">
                <Link href="/rewards" asChild>
                  <Button label={t("home.rewards_button")} variant="secondary" />
                </Link>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Link href="/mint" asChild>
                  <Button label={t("home.skins_button")} variant="ghost" />
                </Link>
              </View>
              <View className="flex-1">
                <Link href="/leaderboard" asChild>
                  <Button label={t("home.leaderboard_button")} variant="ghost" />
                </Link>
              </View>
              <View className="flex-1">
                <Link href="/profile" asChild>
                  <Button label={t("home.profile_button")} variant="ghost" />
                </Link>
              </View>
            </View>
          </>
        ) : (
          <UnconnectedHome />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * "Cold start" home rendered when the player has not yet connected a wallet.
 * Keeps the original onboarding-flavor 3-step layout so the wallet pledge
 * remains discoverable; once connected we swap to the engagement surface.
 */
function UnconnectedHome() {
  const { t } = useTranslation();

  return (
    <>
      <Hero />

      <Card>
        <Text className="text-accent text-xs font-bold tracking-widest uppercase mb-2">
          ★ {t("home.intro_story_title")}
        </Text>
        <Text className="text-ink-dim leading-5">{t("home.intro_story_body")}</Text>
      </Card>

      <Step
        n={1}
        title={t("home.step_connect_title")}
        body={t("home.step_connect_desc")}
      >
        <WalletConnectButton />
      </Step>

      <Step
        n={2}
        title={t("home.step_build_title")}
        body={t("home.step_build_desc")}
      >
        <Link href="/colony" asChild>
          <Button label={t("home.step_build_cta")} variant="primary" disabled />
        </Link>
      </Step>

      <Step
        n={3}
        title={t("home.step_claim_title")}
        body={t("home.step_claim_desc")}
      >
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Link href="/rewards" asChild>
              <Button
                label={t("home.rewards_button")}
                variant="secondary"
                disabled
              />
            </Link>
          </View>
          <View className="flex-1">
            <Link href="/mint" asChild>
              <Button label={t("home.skins_button")} variant="secondary" disabled />
            </Link>
          </View>
        </View>
      </Step>

      <View className="flex-row gap-3 mt-2">
        <View className="flex-1">
          <Link href="/leaderboard" asChild>
            <Button label={t("home.leaderboard_button")} variant="ghost" />
          </Link>
        </View>
        <View className="flex-1">
          <Link href="/profile" asChild>
            <Button label={t("home.profile_button")} variant="ghost" />
          </Link>
        </View>
      </View>
    </>
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
  const { t } = useTranslation();
  return (
    <GradientCard colors={HERO_GRADIENT} className="items-center pt-6 pb-8">
      <FloatingBees />
      <FloatingHeroBee />
      <Text className="text-ink text-3xl font-bold mt-2">
        {t("app.title")}
      </Text>
      <Text className="text-ink-dim text-center mt-1 px-6">
        {t("app.tagline")}
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
