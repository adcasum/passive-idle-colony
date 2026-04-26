import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  DeauthorizeAPI,
} from "@solana-mobile/mobile-wallet-adapter-protocol";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey, PublicKeyInitData } from "@solana/web3.js";
import { toUint8Array } from "js-base64";

import { APP_IDENTITY, CHAIN_IDENTIFIER } from "@/lib/solana";

export type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

export type WalletAuthorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

const AUTH_KEY = "pic-wallet-authorization";

function pkFromAddress(address: Base64EncodedAddress): PublicKey {
  return new PublicKey(toUint8Array(address));
}

function fromAuthorized(a: AuthorizedAccount): Account {
  return { ...a, publicKey: pkFromAddress(a.address) };
}

function toWalletAuthorization(
  result: AuthorizationResult,
  prev?: Account,
): WalletAuthorization {
  let selected: Account;
  if (
    !prev ||
    !result.accounts.some(({ address }) => address === prev.address)
  ) {
    selected = fromAuthorized(result.accounts[0]);
  } else {
    selected = prev;
  }
  return {
    accounts: result.accounts.map(fromAuthorized),
    authToken: result.auth_token,
    selectedAccount: selected,
  };
}

function reviver(key: string, value: unknown) {
  if (key === "publicKey") {
    return new PublicKey(value as PublicKeyInitData);
  }
  return value;
}

export async function loadAuthorization(): Promise<WalletAuthorization | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw, reviver);
  } catch {
    return null;
  }
}

export async function saveAuthorization(
  auth: WalletAuthorization | null,
): Promise<void> {
  if (auth === null) {
    await AsyncStorage.removeItem(AUTH_KEY);
    return;
  }
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export async function authorizeWallet(
  prev?: WalletAuthorization | null,
): Promise<WalletAuthorization> {
  return await transact(async (wallet: AuthorizeAPI) => {
    const result = await wallet.authorize({
      identity: APP_IDENTITY,
      chain: CHAIN_IDENTIFIER,
      auth_token: prev?.authToken,
    });
    const next = toWalletAuthorization(result, prev?.selectedAccount);
    await saveAuthorization(next);
    return next;
  });
}

export async function deauthorizeWallet(
  current: WalletAuthorization | null,
): Promise<void> {
  if (!current) return;
  try {
    await transact(async (wallet: DeauthorizeAPI) => {
      await wallet.deauthorize({ auth_token: current.authToken });
    });
  } catch {
    /* ignore — we still wipe local state */
  }
  await saveAuthorization(null);
}
