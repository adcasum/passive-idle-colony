import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { CLAIM_COOLDOWN_HOURS } from "@/constants/buildings";

const CLAIM_NOTIFICATION_ID_KEY = "claim-notif-id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-claim", {
      name: "Daily Claim",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#FFC940",
    });
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;

  const req = await Notifications.requestPermissionsAsync({
    android: {},
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return req.granted ?? req.status === "granted";
}

/**
 * Schedule a single push that fires when the colony has accumulated long enough
 * to make a fresh claim worthwhile. Cancels any previously-scheduled one.
 */
export async function scheduleClaimReadyNotification(
  fireInHours = CLAIM_COOLDOWN_HOURS,
): Promise<void> {
  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  await cancelClaimReadyNotification();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your colony is ready! 🐝",
      body: "Resources have stockpiled — open the app to claim them.",
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, Math.round(fireInHours * 3600)),
      channelId: "daily-claim",
    },
  });

  // Persist via SecureStore-equivalent: AsyncStorage handled by caller layer.
  // We keep last-id only in module scope; dedupe is best-effort.
  scheduledId = id;
  try {
    await AsyncStorage.setItem(CLAIM_NOTIFICATION_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

let scheduledId: string | null = null;

export async function cancelClaimReadyNotification(): Promise<void> {
  try {
    const stored =
      scheduledId ?? (await AsyncStorage.getItem(CLAIM_NOTIFICATION_ID_KEY));
    if (stored) {
      await Notifications.cancelScheduledNotificationAsync(stored);
      await AsyncStorage.removeItem(CLAIM_NOTIFICATION_ID_KEY);
    }
  } catch {
    /* ignore */
  }
  scheduledId = null;
}
