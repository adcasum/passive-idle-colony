import { getSupabase, supabaseEnabled } from "@/lib/supabase";

export type AnalyticsEvent =
  | "app_open"
  | "wallet_connect"
  | "wallet_disconnect"
  | "build"
  | "upgrade"
  | "demolish"
  | "claim"
  | "mint_skin"
  | "mint_skin_failed"
  | "leaderboard_view"
  | "colony_reset";

interface Props {
  [key: string]: string | number | boolean | null | undefined;
}

let currentWallet: string | null = null;

export function setAnalyticsWallet(wallet: string | null) {
  currentWallet = wallet;
}

/**
 * Fire-and-forget analytics event. Always swallows errors so it never breaks
 * the user's session — analytics failures must not affect gameplay.
 */
export async function track(event: AnalyticsEvent, props: Props = {}) {
  if (!supabaseEnabled()) return;
  try {
    const sb = getSupabase(currentWallet);
    if (!sb) return;
    await sb.from("events").insert({
      wallet_address: currentWallet,
      event,
      props,
    });
  } catch {
    // never throw from analytics
  }
}
