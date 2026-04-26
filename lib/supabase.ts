import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ||
  "";

const ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ||
  "";

let cached: SupabaseClient | null = null;
let cachedWallet: string | null = null;

/**
 * Get the Supabase client, optionally bound to a wallet address. The address
 * is sent in the `x-wallet-address` header — RLS policies then check it via
 * `current_setting('request.headers')->>'x-wallet-address'`.
 *
 * If the URL or anon key are not configured, returns null. All Supabase
 * features (analytics, cloud-save, leaderboard) become no-ops in that case.
 */
export function getSupabase(walletAddress?: string | null): SupabaseClient | null {
  if (!URL || !ANON_KEY) return null;

  const w = walletAddress ?? null;
  if (cached && cachedWallet === w) return cached;

  cached = createClient(URL, ANON_KEY, {
    auth: {
      // We don't use Supabase auth in Phase A — RLS uses x-wallet-address.
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: w ? { "x-wallet-address": w } : {},
    },
  });
  cachedWallet = w;
  return cached;
}

export function supabaseEnabled(): boolean {
  return Boolean(URL && ANON_KEY);
}

export const SUPABASE_URL = URL;
