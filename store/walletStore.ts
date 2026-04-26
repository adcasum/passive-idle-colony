import { create } from "zustand";

import {
  type Account,
  type WalletAuthorization,
  authorizeWallet as doAuthorize,
  deauthorizeWallet as doDeauthorize,
  loadAuthorization,
} from "@/lib/walletAuth";

interface WalletState {
  authorization: WalletAuthorization | null;
  selectedAccount: Account | null;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  authorization: null,
  selectedAccount: null,
  loading: false,
  error: null,

  hydrate: async () => {
    const auth = await loadAuthorization();
    set({
      authorization: auth,
      selectedAccount: auth?.selectedAccount ?? null,
    });
  },

  connect: async () => {
    set({ loading: true, error: null });
    try {
      const next = await doAuthorize(get().authorization);
      set({
        authorization: next,
        selectedAccount: next.selectedAccount,
        loading: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ loading: false, error: msg });
      throw e;
    }
  },

  disconnect: async () => {
    set({ loading: true, error: null });
    try {
      await doDeauthorize(get().authorization);
      set({ authorization: null, selectedAccount: null, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ loading: false, error: msg });
      throw e;
    }
  },
}));
