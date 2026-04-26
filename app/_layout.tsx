import "@/lib/polyfills";
import "@/global.css";

import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useWalletStore } from "@/store/walletStore";
import { ensureNotificationPermissions } from "@/lib/notifications";
import { setAnalyticsWallet, track } from "@/lib/analytics";
import { useCloudSync } from "@/hooks/useCloudSync";
import { Onboarding } from "@/components/Onboarding/Onboarding";
import { ToastHost } from "@/components/UI/ToastHost";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const hydrate = useWalletStore((s) => s.hydrate);
  const account = useWalletStore((s) => s.selectedAccount);

  useCloudSync();

  useEffect(() => {
    hydrate().catch(() => undefined);
    ensureNotificationPermissions().catch(() => undefined);
    track("app_open");
  }, [hydrate]);

  useEffect(() => {
    const addr = account?.publicKey.toBase58() ?? null;
    setAnalyticsWallet(addr);
    if (addr) track("wallet_connect", { address: addr });
  }, [account]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#1A140A" }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#1A140A" },
              headerTintColor: "#FFF4D6",
              headerTitleStyle: { fontWeight: "700" },
              contentStyle: { backgroundColor: "#1A140A" },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="colony/index" options={{ title: "Colony" }} />
            <Stack.Screen name="rewards/index" options={{ title: "Rewards" }} />
            <Stack.Screen name="leaderboard/index" options={{ title: "Leaderboard" }} />
            <Stack.Screen name="mint/index" options={{ title: "Mint Skin" }} />
            <Stack.Screen name="profile/index" options={{ title: "Profile" }} />
          </Stack>
          <Onboarding />
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
