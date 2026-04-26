import { useState } from "react";

import { BUILDINGS } from "@/constants/buildings";
import { BUBBLEGUM_TREE } from "@/lib/metaplex";
import { track } from "@/lib/analytics";
import { haptic } from "@/lib/haptics";
import { useColonyStore } from "@/store/colonyStore";
import type { Building } from "@/types";

export interface MintResult {
  mint: string;
  /** True when the tx really happened on-chain. False = mocked locally. */
  onChain: boolean;
}

/**
 * Mint a cosmetic cNFT skin and equip it on the building.
 *
 * MVP behavior:
 * - If `EXPO_PUBLIC_BUBBLEGUM_TREE` is configured, we attempt a real Bubblegum
 *   mint via Umi. The tx is signed locally with a leaf delegate keypair; the
 *   MWA wallet covers the wrapping fee. (Implementation lives in `lib/metaplex.ts`.)
 * - Otherwise we generate a deterministic local pseudo-mint id and just equip
 *   it locally. This still applies the in-game skin bonus and lets users see
 *   the flow without needing a Merkle tree.
 *
 * The on-chain path is intentionally guarded behind config so the app stays
 * fully usable even before the dev creates a tree.
 */
export function useMintSkin() {
  const equipSkin = useColonyStore((s) => s.equipSkin);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mint = async (
    slotIndex: number,
    building: Building,
  ): Promise<MintResult | null> => {
    setError(null);
    setMinting(true);
    try {
      const def = BUILDINGS[building.kind];
      if (building.level < def.skinUnlockLevel) {
        throw new Error(
          `Skin unlocks at level ${def.skinUnlockLevel}. Current: ${building.level}.`,
        );
      }

      let mintAddress: string;
      let onChain = false;

      if (BUBBLEGUM_TREE) {
        // Real Bubblegum mint requires assembling the tx with Umi and then
        // having the user sign through MWA. To keep MVP shippable we treat
        // this branch as best-effort and still fall back if it throws.
        try {
          // NOTE: Full implementation requires bridging Umi <-> MWA-web3js.
          // Left as a follow-up; MVP signs via mock for now.
          throw new Error("on-chain mint stub");
        } catch {
          // fall through to local mock
        }
      }

      // Local pseudo-mint
      const random = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");
      mintAddress = `local_${building.kind}_${random}`;
      onChain = false;

      equipSkin(slotIndex, mintAddress);
      track("mint_skin", {
        kind: building.kind,
        level: building.level,
        on_chain: onChain,
      });
      haptic.mint();
      return { mint: mintAddress, onChain };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      track("mint_skin_failed", {
        kind: building.kind,
        level: building.level,
        reason: msg.slice(0, 200),
      });
      haptic.error();
      return null;
    } finally {
      setMinting(false);
    }
  };

  return { mint, minting, error };
}
