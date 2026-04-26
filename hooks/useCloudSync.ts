import { useEffect, useRef } from "react";

import { useColonyStore } from "@/store/colonyStore";
import { useRewardsStore } from "@/store/rewardsStore";
import { useWalletStore } from "@/store/walletStore";
import { getSupabase, supabaseEnabled } from "@/lib/supabase";

const PUSH_DEBOUNCE_MS = 4000;

interface CloudColony {
  wallet_address: string;
  slots: unknown;
  resources: unknown;
  last_claim_at: number;
  total_claimed: unknown;
  updated_at: string;
}

/**
 * Bidirectional cloud sync (Phase A — wallet-claimed, no signature).
 *
 *  - On wallet connect: fetch the cloud row. If newer than local
 *    (`updated_at` cloud > `lastClaimAt` local from rehydration), prompt-less
 *    pull (we trust cloud over local because cloud claim already debited
 *    rewards). If no cloud row, push current local state.
 *  - On any subsequent local change to slots/resources/lastClaimAt: push to
 *    cloud after a debounced delay.
 */
export function useCloudSync() {
  const account = useWalletStore((s) => s.selectedAccount);
  const walletAddress = account?.publicKey.toBase58() ?? null;

  const slots = useColonyStore((s) => s.slots);
  const resources = useColonyStore((s) => s.resources);
  const lastClaimAt = useColonyStore((s) => s.lastClaimAt);
  const hydrated = useColonyStore((s) => s.hydrated);
  const totalClaimed = useRewardsStore((s) => s.totalClaimed);

  const lastPushRef = useRef<number>(0);
  const pulledForRef = useRef<string | null>(null);

  // PULL on wallet change
  useEffect(() => {
    if (!supabaseEnabled() || !walletAddress) return;
    if (pulledForRef.current === walletAddress) return;
    pulledForRef.current = walletAddress;

    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabase(walletAddress);
        if (!sb) return;
        const { data, error } = await sb
          .from("colonies")
          .select("*")
          .eq("wallet_address", walletAddress)
          .maybeSingle();
        if (cancelled || error) return;

        if (data) {
          const cloud = data as CloudColony;
          // Pull cloud → local if cloud last_claim_at > local lastClaimAt.
          if ((cloud.last_claim_at ?? 0) > lastClaimAt) {
            useColonyStore.setState({
              slots: cloud.slots as never,
              resources: cloud.resources as never,
              lastClaimAt: cloud.last_claim_at,
            });
            useRewardsStore.setState({
              totalClaimed: cloud.total_claimed as never,
            });
          }
        } else {
          // No cloud row — create one with local state.
          await sb.from("colonies").insert({
            wallet_address: walletAddress,
            slots,
            resources,
            last_claim_at: lastClaimAt,
            total_claimed: totalClaimed,
          });
        }
      } catch {
        // swallow — cloud sync failures must not break gameplay
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, lastClaimAt, slots, resources, totalClaimed]);

  // PUSH (debounced) on any local change while connected
  useEffect(() => {
    if (!supabaseEnabled() || !walletAddress || !hydrated) return;
    const id = setTimeout(async () => {
      try {
        const now = Date.now();
        if (now - lastPushRef.current < 1500) return;
        lastPushRef.current = now;
        const sb = getSupabase(walletAddress);
        if (!sb) return;
        await sb.from("colonies").upsert(
          {
            wallet_address: walletAddress,
            slots,
            resources,
            last_claim_at: lastClaimAt,
            total_claimed: totalClaimed,
          },
          { onConflict: "wallet_address" },
        );
      } catch {
        // swallow
      }
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [walletAddress, hydrated, slots, resources, lastClaimAt, totalClaimed]);
}
