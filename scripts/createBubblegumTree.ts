/**
 * One-time helper to create a Bubblegum Merkle tree for compressed NFT mints.
 * Run on a workstation, NOT inside the mobile app.
 *
 *   ts-node scripts/createBubblegumTree.ts
 *
 * Required env:
 *   SOLANA_KEYPAIR_PATH=/path/to/devnet-keypair.json
 *   RPC_URL=https://devnet.helius-rpc.com/?api-key=...
 *
 * After it prints the tree address, set EXPO_PUBLIC_BUBBLEGUM_TREE in `.env`
 * (or as an EAS environment variable for builds).
 */

import * as fs from "fs";
import { Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
  Umi,
} from "@metaplex-foundation/umi";
import {
  createTree,
  mplBubblegum,
} from "@metaplex-foundation/mpl-bubblegum";

async function main() {
  const RPC_URL = process.env.RPC_URL;
  const KEYPAIR_PATH = process.env.SOLANA_KEYPAIR_PATH;

  if (!RPC_URL) throw new Error("Set RPC_URL env var");
  if (!KEYPAIR_PATH) throw new Error("Set SOLANA_KEYPAIR_PATH env var");

  const secret = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf8")) as number[];
  const kp = Keypair.fromSecretKey(Uint8Array.from(secret));

  const umi: Umi = createUmi(RPC_URL).use(mplBubblegum());
  umi.use(
    keypairIdentity({
      publicKey: umi.eddsa.createKeypairFromSecretKey(kp.secretKey).publicKey,
      secretKey: kp.secretKey,
    }),
  );

  const merkleTree = generateSigner(umi);

  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14, // up to ~16k nodes; bump to 20 for ~1M
    maxBufferSize: 64,
    canopyDepth: 11,
  });

  const sig = await builder.sendAndConfirm(umi);
  console.log("Tree created:", merkleTree.publicKey.toString());
  console.log("Tx:", Buffer.from(sig.signature).toString("hex"));
  console.log("\nSet:\n  EXPO_PUBLIC_BUBBLEGUM_TREE=" + merkleTree.publicKey.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
