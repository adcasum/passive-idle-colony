import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/UI/Card";
import { fmtNum } from "@/lib/format";
import { getSupabase, supabaseEnabled } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { useWalletStore } from "@/store/walletStore";

interface Row {
  wallet_address: string;
  honey_total: number;
  energy_total: number;
  food_total: number;
  water_total: number;
  slot_count: number;
}

const LIMIT = 100;

function shortAddr(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function LeaderboardScreen() {
  const account = useWalletStore((s) => s.selectedAccount);
  const myAddress = account?.publicKey.toBase58() ?? null;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const load = async () => {
    if (!supabaseEnabled()) {
      setError(t("errors.cloud_disabled"));
      setRows([]);
      return;
    }
    setError(null);
    const sb = getSupabase(myAddress);
    if (!sb) {
      setRows([]);
      return;
    }
    // PostgREST doesn't preserve the view's internal ORDER BY, so we have to
    // sort explicitly here or the leaderboard could come back unordered.
    const { data, error: err } = await sb
      .from("leaderboard")
      .select("*")
      .order("honey_total", { ascending: false })
      .limit(LIMIT);
    if (err) {
      setError(err.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => {
    track("leaderboard_view");
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC940" />}
      >
        <Card>
          <Text className="text-ink text-lg font-semibold mb-1">{t("leaderboard.title")}</Text>
        </Card>

        {rows === null ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#FFC940" />
          </View>
        ) : error ? (
          <Card>
            <Text className="text-accent-warn">{error}</Text>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <Text className="text-ink-dim text-center">
              {t("leaderboard.no_data")}
            </Text>
          </Card>
        ) : (
          <Card>
            {rows.map((r, i) => {
              const isMe = myAddress && r.wallet_address === myAddress;
              return (
                <View
                  key={r.wallet_address}
                  className={`flex-row items-center py-2 ${
                    i > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <Text
                    className="text-ink-mute w-8"
                    style={{ fontWeight: "700" }}
                  >
                    #{i + 1}
                  </Text>
                  <View className="flex-1">
                    <Text
                      className={isMe ? "text-accent" : "text-ink"}
                      style={{ fontWeight: "600" }}
                    >
                      {isMe ? t("leaderboard.you_label") : shortAddr(r.wallet_address)}
                    </Text>
                    <Text className="text-ink-mute text-[10px]">
                      {r.slot_count}/9
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-accent-honey font-bold">
                      🍯 {fmtNum(r.honey_total)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
