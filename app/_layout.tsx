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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const hydrate = useWalletStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch(() => undefined);
    ensureNotificationPermissions().catch(() => undefined);
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#0B0F1A" },
              headerTintColor: "#F4F6FB",
              headerTitleStyle: { fontWeight: "700" },
              contentStyle: { backgroundColor: "#0B0F1A" },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="colony/index" options={{ title: "Colony" }} />
            <Stack.Screen name="rewards/index" options={{ title: "Rewards" }} />
            <Stack.Screen name="mint/index" options={{ title: "Mint Skin" }} />
            <Stack.Screen name="profile/index" options={{ title: "Profile" }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
