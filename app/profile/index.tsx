import * as Clipboard from "expo-clipboard";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { WalletConnectButton } from "@/components/Shared/WalletConnectButton";
import { LanguagePicker } from "@/components/Profile/LanguagePicker";
import { useColonyStore } from "@/store/colonyStore";
import { useRewardsStore } from "@/store/rewardsStore";
import { useWallet } from "@/hooks/useWallet";
import { CLUSTER, RPC_URL } from "@/lib/solana";
import { ellipsify, fmtNum } from "@/lib/format";

export default function ProfileScreen() {
  const { address, solBalance, balanceLoading } = useWallet();
  const resetColony = useColonyStore((s) => s.reset);
  const resetRewards = useRewardsStore((s) => s.reset);
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text className="text-ink text-lg font-semibold mb-3">
            {t("profile.wallet_section")}
          </Text>
          <WalletConnectButton />
          {address ? (
            <View className="mt-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">{t("profile.address_label")}</Text>
                <Text
                  className="text-ink"
                  onPress={() => {
                    Clipboard.setStringAsync(address);
                    Alert.alert(t("profile.copied_title"), address);
                  }}
                >
                  {ellipsify(address, 6, 6)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">{t("profile.balance_label")}</Text>
                <Text className="text-ink">
                  {balanceLoading
                    ? "…"
                    : solBalance !== null
                      ? `${fmtNum(solBalance)} SOL`
                      : "—"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">{t("profile.network_label")}</Text>
                <Text className="text-ink">{CLUSTER}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-ink-mute">{t("profile.rpc_label")}</Text>
                <Text className="text-ink-dim text-xs">
                  {ellipsify(RPC_URL, 18, 14)}
                </Text>
              </View>
            </View>
          ) : null}
        </Card>

        <Card>
          <LanguagePicker />
        </Card>

        <Card>
          <Text className="text-ink text-lg font-semibold mb-3">
            {t("profile.danger_section")}
          </Text>
          <Text className="text-ink-dim mb-3">
            {t("profile.reset_confirm_body")}
          </Text>
          <Button
            variant="danger"
            label={t("profile.reset_button")}
            onPress={() => {
              Alert.alert(
                t("profile.reset_confirm_title"),
                t("profile.reset_confirm_body"),
                [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("profile.reset_confirm_yes"),
                    style: "destructive",
                    onPress: () => {
                      resetColony();
                      resetRewards();
                    },
                  },
                ],
              );
            }}
          />
        </Card>

        <Card>
          <Text className="text-ink text-lg font-semibold mb-2">
            {t("profile.about_section")}
          </Text>
          <Text className="text-ink-dim">{t("app.tagline")}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
