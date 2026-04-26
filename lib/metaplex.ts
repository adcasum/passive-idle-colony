import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  publicKey as umiPublicKey,
  Umi,
  type PublicKey as UmiPublicKey,
} from "@metaplex-foundation/umi";
import {
  mintV1,
  mplBubblegum,
  type MetadataArgsArgs,
} from "@metaplex-foundation/mpl-bubblegum";

import { RPC_URL } from "@/lib/solana";

let _umi: Umi | null = null;

export function getUmi(): Umi {
  if (!_umi) {
    _umi = createUmi(RPC_URL).use(mplBubblegum());
  }
  return _umi;
}

/**
 * Address of a Bubblegum Merkle tree the app owns. cNFTs are minted into it.
 *
 * For MVP, this is read from EXPO_PUBLIC_BUBBLEGUM_TREE. If unset, mint flow
 * displays a placeholder. To create a tree once and reuse it, see README.md
 * (section "Setting up Bubblegum tree").
 */
export const BUBBLEGUM_TREE: UmiPublicKey | null = (() => {
  const raw = process.env.EXPO_PUBLIC_BUBBLEGUM_TREE;
  if (!raw) return null;
  try {
    return umiPublicKey(raw);
  } catch {
    return null;
  }
})();

export const BUBBLEGUM_COLLECTION: UmiPublicKey | null = (() => {
  const raw = process.env.EXPO_PUBLIC_BUBBLEGUM_COLLECTION;
  if (!raw) return null;
  try {
    return umiPublicKey(raw);
  } catch {
    return null;
  }
})();

export interface SkinMetadata {
  name: string;
  symbol: string;
  uri: string; // off-chain JSON
  sellerFeeBasisPoints?: number;
}

/**
 * Build a transaction that mints a cNFT to the given owner.
 *
 * NOTE: This builds the transaction with Umi but actual signing must be
 * performed via Mobile Wallet Adapter. The returned object is already signed
 * by the leaf-signer (a throw-away keypair) used by Bubblegum metadata; the
 * caller must still pay+sign the wrapping tx via MWA.
 *
 * For MVP simplicity, the lower-level integration is in `useMintSkin` hook.
 */
export async function buildMintInstruction(
  owner: UmiPublicKey,
  metadata: SkinMetadata,
) {
  if (!BUBBLEGUM_TREE) {
    throw new Error(
      "Bubblegum Merkle tree not configured. Set EXPO_PUBLIC_BUBBLEGUM_TREE.",
    );
  }
  const umi = getUmi();
  const leafOwner = owner;
  const leafDelegate = generateSigner(umi);

  const args: MetadataArgsArgs = {
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    sellerFeeBasisPoints: metadata.sellerFeeBasisPoints ?? 0,
    collection: BUBBLEGUM_COLLECTION
      ? { key: BUBBLEGUM_COLLECTION, verified: false }
      : null,
    creators: [],
  };

  return mintV1(umi, {
    leafOwner,
    leafDelegate: leafDelegate.publicKey,
    merkleTree: BUBBLEGUM_TREE,
    metadata: args,
  });
}
