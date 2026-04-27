/**
 * Deterministic colony / apiary name from a wallet address.
 *
 * We deliberately keep the words English-flavoured (cozy fantasy beekeeping)
 * and surface them as a `{{name}}` interpolation token in i18n strings, so
 * each locale can wrap them in its own pattern (e.g. "Queen of {{name}}
 * Apiary" → "Королева пасеки {{name}}").
 *
 * The name is pure-deterministic: same wallet always yields the same name.
 */

const PREFIXES = [
  "Goldenmeadow",
  "Sunpetal",
  "Honeybrook",
  "Cloverveil",
  "Lindenglade",
  "Amberbloom",
  "Wildhoney",
  "Dustpollen",
  "Sunfield",
  "Buttercup",
  "Mossflower",
  "Thistledown",
  "Marigold",
  "Lavender",
  "Heatherwild",
  "Briarsweet",
  "Honeycomb",
  "Saffron",
  "Hawthorn",
  "Glimmerdew",
  "Whisperwind",
  "Sunwhisper",
  "Goldenpollen",
  "Hivelight",
  "Quietmeadow",
  "Beebrook",
  "Pollenstone",
  "Softglade",
  "Gentlewax",
  "Suncomb",
  "Royalmeadow",
  "Ambercourt",
] as const;

const SUFFIXES = [
  "",
  " Hollow",
  " Ridge",
  " Glen",
  " Vale",
  " Reach",
  " Dell",
  " Court",
  " Hill",
  " Garden",
  " Brook",
  " Field",
  " Meadow",
  " Bluff",
  " Bower",
  " Coppice",
] as const;

/**
 * Stable string hash (FNV-1a 32-bit). Avoids any platform-specific behavior.
 */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/**
 * Generate the cozy colony name (e.g. "Goldenmeadow Hollow"). Pure & stable.
 *
 * Returns "" for empty / falsy input — callers should fall back to an
 * anonymous greeting (`home.greeting_anon`) in that case.
 */
export function queenColonyName(walletAddress: string | null | undefined): string {
  if (!walletAddress) return "";
  const h = hashString(walletAddress);
  const prefix = PREFIXES[h % PREFIXES.length];
  const suffix = SUFFIXES[Math.floor(h / PREFIXES.length) % SUFFIXES.length];
  return `${prefix}${suffix}`.trim();
}
