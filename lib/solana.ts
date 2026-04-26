import { Connection, Cluster, clusterApiUrl, PublicKey } from "@solana/web3.js";
import Constants from "expo-constants";

const extra =
  (Constants.expoConfig?.extra as
    | { rpcUrl?: string; cluster?: Cluster }
    | undefined) ?? {};

export const RPC_URL: string =
  process.env.EXPO_PUBLIC_RPC_URL || extra.rpcUrl || clusterApiUrl("devnet");

export const CLUSTER: Cluster =
  ((process.env.EXPO_PUBLIC_CLUSTER as Cluster | undefined) ||
    extra.cluster ||
    "devnet") as Cluster;

export const CHAIN_IDENTIFIER = `solana:${CLUSTER}` as const;

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed");
  }
  return _connection;
}

export async function fetchSolBalance(
  pubkey: PublicKey | string,
): Promise<number> {
  const conn = getConnection();
  const pk = typeof pubkey === "string" ? new PublicKey(pubkey) : pubkey;
  const lamports = await conn.getBalance(pk);
  return lamports / 1_000_000_000;
}

export const APP_IDENTITY = {
  name: "Passive Idle Colony",
  uri: "https://passive-idle-colony.app",
  icon: "favicon.ico",
};
