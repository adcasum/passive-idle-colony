/** Compact number formatter: 12345 -> "12.3k", 1.234 -> "1.23". */
export function fmtNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (abs >= 1000) return `${(n / 1000).toFixed(2)}k`;
  if (abs >= 10) return n.toFixed(1);
  if (abs >= 1) return n.toFixed(digits);
  if (abs > 0 && abs < 1) return n.toFixed(2);
  return "0";
}

/** Truncate a Solana address to `4...4`. */
export function ellipsify(addr: string, head = 4, tail = 4): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
