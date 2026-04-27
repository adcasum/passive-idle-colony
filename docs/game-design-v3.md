# Passive Idle Colony — Design Doc v3

*"Logic, security, long-term arc, retention."*

This is a planning doc, not code. Goal: figure out **why** a player would
play tomorrow, in two weeks, and in three months — and what
infrastructure / safety / progression has to exist to support that.

Phase 3a–3c shipped: cloud save, leaderboard, narrative hero, daily
quests, login streak, tap-to-tend, Spring Bloom, 8h cooldown,
demolish-confirm, first-build glow, 14 locales. The remaining gaps
fall into three buckets.

---

## 1. Security audit (what's actually unsafe today)

The current cloud / multiplayer surface was always documented as "Phase
A — replace with SIWS in Phase B" but Phase B never happened. Below are
the concrete attack vectors that exist on `main` right now.

### 1.1 Wallet-spoofing on cloud save

`supabase/migrations/0001_initial_schema.sql` documents the trust model
explicitly:

> RLS policies use `x-wallet-address` header set by client. **This is
> NOT secure against forgery** and is replaced in Phase B by SIWS-issued
> JWTs.

**Attack:** any client (curl, Postman, modified app) sets
`x-wallet-address: <victim wallet>` and overwrites the victim's cloud
colony with whatever values they want, OR pulls the victim's colony to
read it.

**Severity for THIS game:** medium — there's no real currency at stake
on the cloud row (just slot/resource state); but it's enough to grief
a leaderboard rival by zeroing their `total_claimed`, or to scrape
which wallets are active players for phishing.

**Fix (Phase 4-S1):** Sign-In With Solana via Supabase Edge Function.
Player signs a nonce → Edge Function verifies signature → issues a
short-lived Supabase JWT with `sub = wallet_address`. RLS policies
become `using (auth.jwt()->>'sub' = wallet_address)`. Drop the header
helper entirely.

Implementation cost: ~1 day of Edge Function + 1 hook refactor.
Existing `lib/walletAuth.ts` already does the hard part (mobile wallet
adapter signing).

### 1.2 Client-trusted progress (the big one)

The cloud row stores `slots`, `resources`, `last_claim_at`,
`total_claimed` *exactly as the client sends them*. Nothing on the
server validates the math. A modified client can:

- Set every slot to L9 of the highest-tier building **on day 1**.
- Set `total_claimed.honey = Number.MAX_SAFE_INTEGER` → instant rank #1 on leaderboard.
- Set `last_claim_at = 0` → claim 48 hours of accrual every push.

**Why this matters more than 1.1:** Even *with* SIWS, a player will
still own their own row. Owner-trusted economic state means leaderboard
is a fiction.

**Fix (Phase 4-S2):** Move the source-of-truth math server-side.

Two options, ranked by cost:

| Option | Effort | Anti-cheat strength |
|---|---|---|
| **A. Server-validated claim only.** Edge Function recomputes pending production from the *previous* server-side colony state + elapsed time. Client receives the granted resources but cannot inflate `total_claimed`. Build/upgrade still client-side. | ~3 days | **High for the leaderboard.** Mid for resource state (player can still cheat their *local* numbers, but they can't push them to cloud). |
| **B. Full server colony.** Every action (build, upgrade, claim, tend) goes through Edge Function. Client is purely a view. | ~2 weeks | **Maximum.** Effectively turns the game into a thin client. |

**Recommendation:** A. The product is a relaxed cozy idle, not a
competitive PvP economy. Spending a fortnight on B is overkill. A
gives us a trustworthy global ranking at modest cost.

### 1.3 Local anti-cheat (clock manipulation)

`Date.now()` is used in:

- `useDailyClaim` cooldown check (`lastClaimAt + 8h`)
- `useTapToTend` per-tile cooldown
- `bloomStatus()` — deterministic UTC schedule
- Login streak day rollover

A player can **set device clock forward** and bypass all cooldowns
locally. They get all the local numbers (toasts, animations) for free.

**Why we can mostly ignore this:** if 1.2 is fixed (server-validated
claim), the cheater's *cloud* row still only counts honest elapsed
time, so they don't gain ranking. Their local numbers will desync at
the next claim, which the user will notice as a "lost progress" bug
report — pain we don't want.

**Mitigation (Phase 4-S3):** Use a **monotonic clock** (`performance.now()`-style elapsed) for the live tick UI, and the **server's reply** for the authoritative `lastClaimAt`. Treat `Date.now()` as advisory only. ~half a day.

### 1.4 cNFT mint earning

Skins are minted via Metaplex Bubblegum on Solana, signed by the
player. The on-chain mint is unforgeable — but **earning** the skin is
gated by `useColonyStore` claiming the building is at the right level.
A modified client can mint any skin without earning it.

**Severity:** very low today (skins are cosmetic, not tradeable for
gameplay advantage). Will rise sharply if we ever add stat-boosting
NFTs.

**Fix (Phase 4-S4):** When stat-NFTs ship, gate mint via Edge Function
that re-validates earned condition against server colony state, then
returns a server-signed payload that the on-chain Merkle proof check
validates. ~2 days.

### 1.5 Lower-priority items (do not block phase 4)

| Item | Why | Mitigation |
|---|---|---|
| Events table grows unboundedly | Cost / privacy | Add a Supabase scheduled `delete from events where created_at < now() - 90 days` |
| Wallet address in events table | Mild PII (it's already public on-chain) | Add a "delete my data" button in Profile that calls an Edge Function |
| Leaderboard exposes all wallets publicly | Anyone can scrape | Add opt-out in Profile; default opt-in is fine |
| No rate-limit on Supabase inserts | DoS | Supabase free tier already rate-limits; revisit at scale |

### Security recommendation summary

Phase 4-S (security) is **3 small steps** — none individually huge.
Roughly:

- **S1 SIWS auth** (1 day) — close the wallet-spoof hole.
- **S2 Server-validated claim** (3 days) — make the leaderboard real.
- **S3 Monotonic claim clock** (½ day) — defang local clock abuse.

Total ~1 week. Deserves its own PR before any more retention work.

---

## 2. End goal — what is the player working toward?

### 2.1 Diagnosis: today the answer is nothing

Once you place 9 buildings and upgrade them to soft-cap (~L8 each) and
mint a skin per kind, you've **finished**. Engagement layer (quests,
streak, hero, bloom) just decorates the same loop.

For an idle game to keep a player a year, there has to be a *visible
ladder that always shows one more rung above your head*. A new player
should see "Tier 1: build hives" and a vet should see "Tier 7: ascend
to Royal Court". They should never see the top.

### 2.2 Proposed long-term arc

```
        Genesis (today)             Mid-game                 End-game / Forever
┌─────────────────────────┐  ┌──────────────────────┐  ┌───────────────────────────┐
│ 9 slots, 6 building     │  │ 5 colonies (hex map),│  │ Royal Court — prestige.   │
│ kinds, level 1-9 each.  │  │ inter-colony trade,  │  │ Each Crowning resets to a │
│ 1 mint per slot. Bloom  │  │ guild raids, season  │  │ stronger Genesis with     │
│ event every 5 days.     │  │ ladder.              │  │ permanent court bonuses & │
│                         │  │                      │  │ a one-of-one cNFT crown.  │
│ ~ 2-4 weeks of play     │  │ ~ 2-3 months         │  │ ∞ (compounding)           │
└─────────────────────────┘  └──────────────────────┘  └───────────────────────────┘
       Phase 1-3 (done)         Phase 4-G (next)            Phase 5-P (later)
```

### 2.3 Genesis → Mid-game (Phase 4-G)

Adds the second axis of progression: **multiple colonies on a hex map**.

- The 3×3 grid is now your **starter colony**. After completing it
  (every slot at L≥5), a "Found Sister Colony" button unlocks.
- World map is a hexagonal lattice. You start at the center; sister
  colonies sit on adjacent hexes. Maximum 5 colonies per account at
  this stage.
- Each colony specializes (you can only build certain kinds). Gives a
  reason to have multiple: a Beekeeper colony for honey, a Glade
  colony for food, a Reservoir colony for water.
- **Trade routes**: you set a route between two of your colonies; one
  ships X resource per hour to the other in exchange for Y. Encourages
  asymmetric specialization.
- **Guild**: opt-in clan of up to 12 players. Guild members can send
  one care package per day to another guildmate (small resource bump,
  builds social bond, mostly cosmetic). Once / month, guild raids a
  shared NPC challenge (e.g. "the Drought") for a guild leaderboard.

This adds **~50-80h** of progression on top of Genesis without
ballooning code complexity, because the colony UI and math are already
written — we just instantiate them N times.

### 2.4 Mid → End (Phase 5-P, "Royal Court")

The classical idle prestige pattern. Once your account meets
"all 5 colonies at Tier 9 cumulative score", a **Crown** appears on
Home. Tapping it gives:

- A one-of-one cNFT crown skin tied to the season number (real Solana
  asset, tradeable / showable).
- A permanent **Royal Court bonus**: e.g. +5% to all production.
- **Reset of all 5 colonies** to Genesis state (slots empty, resources
  back to 30/30/30/30, but XP, streak, login history, cNFT crowns are
  preserved).
- A spot on the **All-Time Crown Ladder** (separate leaderboard ranked
  by # crowns × (season number)).

Crowning is opt-in — no pressure. Players who don't want to grind to
that level can stay at end of mid-game indefinitely.

The hook: each crown is *measurably stronger than the last* (compounding
+5%) and visually trophies up the player's collection. There is no
ceiling — the game can be played forever, and a year-2 player will have
8-10 crowns and a Royal Court bonus of +40-50%. They will brag about it.

### 2.5 Seasons (overlay on top of all of the above)

Every **8 weeks** is a season. A season has:

1. A flavored skin theme (e.g. "Autumn Honey" — all minted skins this
   season have an autumn palette).
2. Three season quests (e.g. "Crown 1 colony", "Build 50 buildings",
   "Win a guild raid"). Completing all 3 unlocks the season cNFT
   medal.
3. A separate seasonal leaderboard that resets at season end.

Seasons are pure FOMO machinery, but they reward without punishing —
a player who skips a season just doesn't get that medal. They still
have all crowns and progress.

---

## 3. Retention loops by cadence

A retention-friendly idle game has a **stack of nested loops**, each
at a different time scale. Player checks in for the shortest loop that
fits how much time they have.

| Loop | Cadence | Mechanic | Status |
|---|---|---|---|
| **Tend** | 5 min | Tap a tile, +5% of an hour. | ✅ shipped (3c) |
| **Mini-event** | 30-60 min | Random tile glows for 10 min: tap during window for ×2 burst. | Proposed (Phase 4-R1) |
| **Claim** | 8 hours | Pull accrued production. | ✅ shipped (3c) |
| **Daily quest** | 24 h | 4 quests, reset 04:00 local. | ✅ shipped (3b) |
| **Streak** | 24 h | Login N days in a row. | ✅ shipped (3b) |
| **Bloom** | 5 days | 24h × 1.5 production window. | ✅ shipped (3c) |
| **Care package** | 24 h (guild) | Send / receive one resource gift / day. | Proposed (Phase 4-G) |
| **Guild raid** | 1 / month | Co-op damage challenge. | Proposed (Phase 4-G) |
| **Season medal** | 8 weeks | Three quests, cNFT reward. | Proposed (Phase 5-P) |
| **Crowning** | ~3-4 months on average | Prestige reset, permanent bonus. | Proposed (Phase 5-P) |

The two loops missing from the **current** stack that would matter most:

#### 3.1 Mini-event (Phase 4-R1, easy to add)

Right now there's nothing between "tend every 5 min" and "claim every
8h". A 30-60 min mini-event fills that gap. Spec:

- Every ~45 min, a random occupied tile pulses cyan for 10 min.
- Tapping the tile during the window grants ×2 of one tend's worth.
- Outside the window, taps are normal tend.
- Mini-events do NOT push notifications (that would be noisy). They're
  rewarded for opening the app, not for being interrupted.

This costs ~½ day to ship (existing tap-to-tend infrastructure).

#### 3.2 Care package (Phase 4-G, requires guild infra)

One small daily action that requires being in a guild. Drives both
retention (you log in to send) and social pressure (you don't want to
ghost your guildmates). Cost ~2 days (guild table, Edge Function for
the send).

---

## 4. "Why play long and come back" — concrete next steps

Translating section 2 + 3 into something we can actually ship in the
next 2-3 PRs.

### Phase 4-S — Security hardening (1 PR, ~1 week)

1. SIWS Edge Function + RLS migration.
2. Server-validated `claim()` Edge Function.
3. Monotonic clock for cooldowns.

**Why first:** before we launch any leaderboard-driven content (mid-game
specialization, guild raids), the leaderboard has to be real. Otherwise
a single bad actor poisons the metric.

### Phase 4-R — Retention micro-additions (1 PR, ~3 days)

1. Mini-event (30-60 min cadence).
2. Streak repair: lose your streak? Spend 1 honey-jar (currency) to
   restore it once. Keeps casual players from rage-quitting.
3. Local-time push notification when claim is ready (already partially
   wired in `lib/notifications.ts`, just need to actually schedule
   from `useDailyClaim`).
4. Dampen storage warning toast (currently fires every refresh once
   you hit 85% — should fire **once per claim cycle**).

### Phase 4-G — Genesis → Mid-game (2-3 PRs, ~3 weeks)

1. **PR 4-G-A:** "Sister Colony" — UI for second colony, hex map shell,
   no networking yet. ~1 week.
2. **PR 4-G-B:** Trade routes between own colonies. ~3 days.
3. **PR 4-G-C:** Guild minimum-viable: opt-in code, guild table in
   Supabase, daily care package, view-only guild leaderboard. ~1 week.

Guild raids and the full hex map fight can come later.

### Phase 5-P — Prestige (1 large PR, ~2 weeks)

1. Crowning ritual UI.
2. Season cNFT crown mint (reuses existing Bubblegum infra).
3. All-Time Crown Ladder leaderboard.
4. Royal Court bonus stacks live on Home Hero.

This is the unbounded ladder. Once shipped the game has no soft-end.

---

## 5. Numbers I'd want to validate before locking the design

These are **non-blocking** but should be tracked:

- **D1 retention** (open game day 2 after first session). Target 35%+.
- **D7 retention.** Target 15%+.
- **D30 retention.** This is the one Phase 5-P is designed to defend.
  Target 7%+ (industry-average for casual idle is 4-5% so 7% is a real
  bar).
- **Median session length.** Current model targets ~2 min × 3 sessions
  = 6 min/day. Higher than that means we should consider session
  caps to avoid burnout (idle games are best in short bursts).
- **Bloom-day attach rate.** What % of WAU log in during a Bloom 24h
  window? If it's >70%, the 5-day cycle works. <40%, we're spreading
  blooms too thin.

We don't have analytics dashboards on these yet — but we already log
events to Supabase, so a dashboard is a Sunday afternoon away.

---

## 6. Recommended order of operations

```
Today                                                              3 mo
├─ 4-S security            (1 wk) ──┐
                                     ├── leaderboard becomes credible
├─ 4-R retention micro    (3 d)  ──┤
                                     │
├─ 4-G mid-game:           (3 wk) ──┤
│  ├ sister colony                   │
│  ├ trade routes                    │
│  └ guild MVP                       │
                                     │
├─ 5-P prestige           (2 wk) ──┘── unbounded ladder
```

Total ~2 months of paced shipping. Each phase produces something
playable on its own; we never block on a multi-month megalith.

---

## 7. What I am NOT proposing

To be explicit:

- **No real-money currency.** No purchasable resources, no premium
  battlepass. cNFT skins remain free-to-mint (tx fee only) and have
  no in-game advantage.
- **No PvP combat.** Guild raids are co-op against NPCs. Leaderboards
  are passive (rank, no direct action against rivals).
- **No push-notification spam.** One claim-ready notification / day
  max, opt-in.
- **No "energy" mechanics that block play.** Tend cooldown is a soft
  pacer, not a paywall.

The game stays cozy. We add depth, not friction.

---

## 8. What needs your decision before I write code

1. **Order of operations** — agree with §6 (Security → Retention →
   Mid-game → Prestige)? Or shuffle?
2. **Server-validated claim (§1.2-A vs B)** — agree with A (cheap
   leaderboard integrity) or want B (full anti-cheat)?
3. **Sister colony cap** — section 2.3 proposes max 5. Open to 3 / 7 /
   ∞?
4. **Crowning frequency** — proposed ~3-4 months/crown for an active
   player. Faster (more frequent prestige bumps) or slower (more
   meaningful)?
5. **Guild size** — 12 proposed (small, intimate). Open to 24 / 50?

Once these five are answered I can write the Phase 4-S PR. Nothing
else (retention, mid-game, prestige) blocks on more design — they
block on Phase 4-S landing.
