import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";

import { fetchSolBalance } from "@/lib/solana";
import { useWalletStore } from "@/store/walletStore";

export function useWallet() {
  const { selectedAccount, authorization, loading, connect, disconnect } =
    useWalletStore();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!selectedAccount) {
      setSolBalance(null);
      return;
    }
    setBalanceLoading(true);
    setBalanceError(null);
    fetchSolBalance(new PublicKey(selectedAccount.publicKey))
      .then((sol) => {
        if (!cancelled) setSolBalance(sol);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setBalanceError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setBalanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAccount]);

  return {
    publicKey: selectedAccount?.publicKey ?? null,
    address: selectedAccount?.publicKey?.toBase58() ?? null,
    label: selectedAccount?.label,
    connected: !!authorization,
    loading,
    connect,
    disconnect,
    solBalance,
    balanceLoading,
    balanceError,
  };
}
