# Passive Idle Colony — Game Design

> **Genre:** Cozy Passive Idle Simulator
> **Target session length:** 30 seconds twice a day
> **Total run length:** 7–14 days for a "complete" colony, then cosmetic / NFT collecting tail

---

## Design pillars

1. **Cozy & low pressure.** The game never punishes you for not playing. Resources stop accumulating when you hit cap (instead of deleting overflow), and the daily cooldown is loose (12h, not 24h, so a busy person can still claim morning + evening or just once a day).
2. **Meaningful daily ritual.** Each claim should feel like a tiny dopamine hit: a number that grew, a building that levelled up, a skin that unlocked.
3. **Solana-native, not Solana-bolted-on.** The cNFT skins are the on-chain hook that ties play to wallet identity — your skins live in your Seed Vault, not in our database, so you own them.
4. **Readable in 5 seconds.** Open the app → see resources, see what's ready to claim, see what's upgradeable. No dense UI.

---

## Core loop (per session, ~30 seconds)

```
open app
 ↓
see "Ready to claim" pulsing badge
 ↓
tap Claim → confetti + numbers tick up
 ↓
tap a slot → upgrade something (or build new) → close
 ↓
schedule next-claim notification → done
```

That's the whole design. Anything more is optional depth.

---

## Resources

| Resource | Color   | Symbol | Theme             |
|----------|---------|--------|-------------------|
| Honey    | #F59E0B | 🍯     | Premium / fuel    |
| Energy   | #F97316 | ⚡     | Throughput        |
| Food     | #84CC16 | 🌾     | Sustain           |
| Water    | #60A5FA | 💧     | Common / abundant |

Honey is the "hero" resource — only the bee hive produces it, it appears most prominently in the UI, and it's needed for high-tier upgrades. Other resources are abundant early but specialize different building paths.

---

## Buildings

| Building          | Produces | Base/hr | Lv5/hr | Cost↗ | Notes                           |
|-------------------|----------|--------:|-------:|------:|---------------------------------|
| 🐝 Bee Hive       | Honey    | 6       | 25     | 1.7×  | Hero building. Unlocks skin L3. |
| ☀️ Solar Panel    | Energy   | 8       | 33     | 1.7×  | Common.                          |
| 🌾 Small Farm     | Food     | 8       | 33     | 1.7×  | Common.                          |
| 💧 Water Collector| Water    | 12      | 49     | 1.7×  | Most abundant resource.          |
| 📦 Storage        | —        | —       | —      | 1.6×  | +200 cap per level (cumulative). |
| 🔬 Research Lab   | —        | —       | —      | 1.8×  | +5% global production / level.   |

Production multiplier per level: **1.4×**. Skin bonus: **+10%** per skin (research lab gives +5% global instead).

### Why these numbers?

**Day 1 first claim (after 1 hour, 1 hive at L1):** ~6 honey. Enough to upgrade a level-1 building's first level-up cost. Players see immediate progress.

**Day 1 second claim (12h cooldown, 1 hive L1, 1 farm L1, 1 water L1):**
- Honey: 6 × 12 = 72 (cap 200, fits)
- Food: 8 × 12 = 96
- Water: 12 × 12 = 144
- Energy: 0

That's enough to upgrade a building or build a new one. Feels like progress.

**Day 7 (rough estimate, 8/9 slots filled with mix of L3 buildings, Research Lab L2):**
- Production multiplier: 1.4³ × (1 + 0.05 × 2) = 2.74 × 1.1 = ~3 × baseline
- Honey/hr: 18 (1 hive at L3 with skin: 6 × 1.4² × 1.1 = ~12.94, with research +10%, ~14)
- After 12h: ~170 honey, just under cap (200 base + storage)

This is when **Storage** matters. A player without storage hits cap. With Storage L1 (+200), cap is 400. They can store up to 24h of accumulation. With Storage L3 (+600), they can comfortably leave the game alone for 2 days without losing potential value (capped at 48h offline).

### Cost example (Bee Hive)

| Level     | Honey | Food | Water |
|-----------|------:|-----:|------:|
| Build (1) | 0     | 10   | 5     |
| → 2       | 0     | 17   | 8.5   |
| → 3       | 0     | 28.9 | 14.5  |
| → 4       | 0     | 49.1 | 24.6  |
| → 5       | 0     | 83.5 | 41.8  |

Total to max: ~178 food, ~89 water. At Day 7 with multiple producers, both are achievable but require focus.

### Why a 12h cooldown (not 24h)?

Most people open phones in the morning and evening. A 12h window catches both, gives "I can play twice today" feeling without forcing daily commitment. If they miss, the offline cap (48h) means they don't lose much.

---

## Progression milestones

| Milestone                  | Trigger                    | Reward                                                  |
|----------------------------|----------------------------|---------------------------------------------------------|
| **First building**         | Place any building         | Unlocks claim button. Notification scheduled.            |
| **First claim**            | Press Claim once           | History entry, total counter starts.                     |
| **First L3 building**      | Upgrade hive to L3         | Mint Skin button appears (golden glow).                  |
| **First cNFT mint**        | Mint a skin                | Skin equipped, +10% production. Skin appears in wallet.  |
| **5 buildings placed**     | 5/9 slots filled           | "Almost a colony" toast.                                 |
| **All 9 slots filled**     | 9/9                        | Achievement card on Profile.                             |
| **All 6 building types**   | At least 1 of each kind    | Discover bonus: +5% global temp boost (24h).             |
| **3+ skins minted**        | 3 cNFTs in wallet          | Special "Master Beekeeper" badge.                        |

---

## Visual / UX language

### Color hierarchy

- **bg:** `#0B0F1A` (Phantom dark)
- **bg-elevated:** `#121826` (cards lifted)
- **bg-card:** `#1A2233` (interactive surfaces)
- **bg-card-glow-honey:** linear-gradient from `#1A2233` to `rgba(245, 158, 11, 0.08)` (resource-tinted cards)
- **accent (action):** `#A78BFA` (purple — primary CTAs, focus states)
- **accent-secondary (success):** `#34D399` (green — positive states)
- **accent-warn:** `#F59E0B` (amber — claim-ready pulse)
- **ink:** `#F4F6FB` (primary text)
- **ink-dim:** `#A6B0C3` (secondary text)
- **ink-mute:** `#6B7388` (labels, captions)

### Motion language

- **Spring physics (Reanimated):** building placement, button press, slot tap. Damping 14, stiffness 220. Quick, slightly bouncy — feels alive.
- **Smooth fade/slide:** modal open, screen transitions. Easing.out(quad), 250–400ms.
- **Pulse:** "claim ready" badge. Loop 1.4s, scale 1.0 → 1.06.
- **Confetti / particle burst:** ONLY on claim success. ~80 particles for 1.5s.
- **Floating bee on Home:** infinite loop, 4s, sine.

### Cozy details

- Slot empty state: dashed outline + faint hexagon pattern
- Active building: subtle inner glow tinted by produced resource color
- Resource counter: pulse on value change (already implemented in `AnimatedResource`)
- Daily claim card: changes background tint when ready (purple → amber gradient)
- Empty colony first-launch: callout arrow pointing at slot 4 (center) with "Tap to start"

---

## Onboarding (first launch only)

3 swipeable cards, dismissable, never shown again:

1. **"Welcome to your colony."** — illustration of a single hive on a hex grid. "Buildings produce resources every hour, even when the app is closed."
2. **"Claim every day."** — illustration of a calendar with a hive. "Claim resources every 12 hours. Up to 48 hours of offline accumulation are saved."
3. **"Skins live in your wallet."** — illustration of a hive + skin + Solana logo. "Mint cNFT skins for your buildings. They give a production bonus and live in your Seed Vault."

After the third card → tap Connect Wallet. Onboarding state stored in AsyncStorage.

---

## Audio (optional v0.2)

If we add sound:
- Soft ambient honey/garden loop (royalty-free, ~30s, looping)
- Tap: subtle thock
- Build: woody confirmation (~200ms)
- Upgrade: chime ascending fifth
- Claim: brass + sparkle
- Skin mint: "shimmer" arpeggio

For MVP, we ship muted with a Settings toggle for future audio.

---

## Anti-patterns to avoid

- ❌ **Energy systems / paywalls.** Never gate progression behind real money or wait timers beyond the 12h claim. cNFTs are cosmetic + tiny boost only.
- ❌ **Overflow loss.** When at cap, resources sit idle, not deleted. Encourages upgrading storage rather than punishing absence.
- ❌ **Premium currency.** All upgrades use earned resources only.
- ❌ **Aggressive notifications.** Exactly one push per claim cycle, opt-in via permission prompt.
- ❌ **FOMO mechanics.** No limited-time events at launch. The game is forever.

---

## Future hooks (not in MVP)

- **Anchor program for on-chain claim** — `colony` PDA storing `lastClaimAt` per wallet. Lets users sync across devices.
- **Anchor-driven skin marketplace** — list/buy skins between players.
- **Seasonal events** — winter biome, summer biome with new building types.
- **Collaborative colonies** — two wallets share resource pool.
- **Token rewards** — at major milestones, drop a small SPL token (only after a long, careful tokenomics design — NOT in MVP).

---

## Balance levers (knobs to tune later)

If economy feels off, tune in this order:

1. `BASE_RESOURCE_CAP` (currently 200). Lower → Storage matters more.
2. `levelMultiplier` on building (currently 1.4). Higher → upgrades feel more impactful, late game stronger.
3. `costMultiplier` (currently 1.7 for buildings). Lower → faster progression, fewer "save up for L5" moments.
4. `CLAIM_COOLDOWN_HOURS` (currently 12). Longer → more ritualistic, less "always-on".
5. `MAX_OFFLINE_HOURS` (currently 48). Don't go below 24 — too punishing for casual players.

All knobs are in `constants/buildings.ts` and `lib/colonyMath.ts` for easy tuning without touching UI code.
