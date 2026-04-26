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
 * Sequencing invariant: for any wallet, the very first PUSH must not run
 * until the PULL for that wallet has finished. Otherwise a slow network
 * could let the debounced PUSH overwrite newer cloud state with stale local
 * state. See `pullDoneFor`.
 *
 *  - On wallet connect (after AsyncStorage hydration): fetch the cloud row.
 *      - If we have no real persisted local state (`hasPersistedState`
 *        is false) we always overwrite local with whatever cloud has.
 *        That's the "reinstall the app, restore from cloud" path.
 *      - Otherwise we only overwrite when cloud `last_claim_at` is strictly
 *        newer than local — local progress is preferred.
 *      - If cloud has no row yet, we insert one from local.
 *  - On any subsequent local change while connected: push to cloud after
 *    a debounced delay.
 */
export function useCloudSync() {
  const account = useWalletStore((s) => s.selectedAccount);
  const walletAddress = account?.publicKey.toBase58() ?? null;

  // PUSH effect needs to subscribe to these so it re-fires on every change.
  const slots = useColonyStore((s) => s.slots);
  const resources = useColonyStore((s) => s.resources);
  const lastClaimAt = useColonyStore((s) => s.lastClaimAt);
  const hydrated = useColonyStore((s) => s.hydrated);
  const totalClaimed = useRewardsStore((s) => s.totalClaimed);

  const lastPushRef = useRef<number>(0);
  // Wallet for which a PULL has been kicked off (prevents duplicate pulls).
  const pulledForRef = useRef<string | null>(null);
  // Wallet for which a PULL has *completed* (success, error, or "no row")
  // — this gates the PUSH effect so it can't race past the PULL.
  const pullDoneForRef = useRef<string | null>(null);

  // PULL on wallet change.
  //
  // Waits for AsyncStorage hydration before running so we know whether the
  // user has real local progress or is on a fresh install. Depends ONLY on
  // walletAddress + hydrated; reads everything else through getState() so
  // ordinary store mutations don't cancel the in-flight fetch.
  //
  // Resets `pulledForRef`/`pullDoneForRef` on disconnect: reconnecting with
  // the same wallet must re-pull, otherwise the unconditional PUSH could
  // clobber newer cloud state.
  useEffect(() => {
    if (!supabaseEnabled() || !walletAddress) {
      pulledForRef.current = null;
      pullDoneForRef.current = null;
      return;
    }
    if (!hydrated) return;
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
          const colony = useColonyStore.getState();
          // Restore from cloud when:
          //   - we have no real local progress (fresh install / reinstall), or
          //   - cloud's last_claim_at is strictly newer than local's.
          const shouldRestore =
            !colony.hasPersistedState ||
            (cloud.last_claim_at ?? 0) > colony.lastClaimAt;
          if (shouldRestore) {
            useColonyStore.setState({
              slots: cloud.slots as never,
              resources: cloud.resources as never,
              lastClaimAt: cloud.last_claim_at,
              hasPersistedState: true,
            });
            useRewardsStore.setState({
              totalClaimed: cloud.total_claimed as never,
            });
          }
        } else {
          // No cloud row — create one with current local state.
          const colonyState = useColonyStore.getState();
          const rewardsState = useRewardsStore.getState();
          await sb.from("colonies").insert({
            wallet_address: walletAddress,
            slots: colonyState.slots,
            resources: colonyState.resources,
            last_claim_at: colonyState.lastClaimAt,
            total_claimed: rewardsState.totalClaimed,
          });
        }
      } catch {
        // swallow — cloud sync failures must not break gameplay
      } finally {
        // Mark the PULL done for this wallet so PUSH may now run.
        // We do this even on error so the user can still keep playing offline
        // — at worst the next change pushes stale local state, but only after
        // we genuinely tried (and failed) to read the cloud first.
        if (!cancelled) {
          pullDoneForRef.current = walletAddress;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, hydrated]);

  // PUSH (debounced) on any local change while connected.
  // Gated on the PULL having completed for this wallet so the PUSH can never
  // race ahead and overwrite cloud state with stale local state.
  useEffect(() => {
    if (!supabaseEnabled() || !walletAddress || !hydrated) return;
    const id = setTimeout(async () => {
      try {
        if (pullDoneForRef.current !== walletAddress) return;
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
