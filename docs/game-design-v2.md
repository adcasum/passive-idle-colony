# Passive Idle Colony — Game Design v2

**Goal of this document:** answer the user feedback "работает, визуал нравится, но
прямого интереса играть нет, ничего не понятно и мало призыва к действию" before
writing more code. We turn the working tech demo into a game people *want* to keep
opening.

This doc proposes the next phase of work and asks for ~5 decisions before
implementation begins.

---

## 1. Honest diagnosis: why the current build feels flat

The home screen successfully says *what* the app is, but it does not say:

1. **Why** the player should care (no story, no protagonist, no stakes).
2. **What they're working toward** (no end-goal visible — just "build, claim, mint").
3. **What is happening right now** (no live status: production rate, hive health,
   colony rank, daily streak).
4. **What to do next** (3-step list is static — a beginner can't see "the next thing").
5. **What they will lose if they skip a day** (no urgency, no FOMO, no streaks).

Idle games that succeed on mobile (Cookie Clicker, Adventure Capitalist, Egg, Inc.,
Bee Factory) all ship the same loop:

> **a clear narrative of growth + a visible long-term goal + short loops that
> reward checking back + medium loops that reward planning + daily loops that
> punish absence.**

We have the frame. We need the loops.

---

## 2. Story / theme proposal

**Working title:** *The Last Apiary*

**Premise:** The world's pollinators are vanishing. Their old queens left behind
empty hives across the meadow. You are chosen by one surviving queen to rebuild
her colony from a single hexagonal cell. As you grow, neighbouring queens hear of
your apiary and come to compete on the **Royal Leaderboard**.

**Why this works for our stack:**

- It is *cozy* (matches the warm honey palette we just shipped) — not aggressive
  or violent.
- It has *eco-narrative weight* (real-world bee decline is widely understood) —
  gives the player a reason that survives outside the game.
- It is *Web3-native* without being preachy: your colony NFT, your hive skin,
  your honey output — all live on-chain, but framed as *the queen's archive*,
  not as "buy crypto".
- It has *room to grow*: queen-to-queen battles, seasonal blooms, royal jelly
  resource, future PvE swarms, all fit naturally.

**Player avatar wording shift:**
- "Connect your wallet" → "Pledge to the Queen"
- "Open Colony" → "Enter the Hive"
- "Rewards" → "Honey Vault"
- "Mint Skin" → "Forge Royal Regalia"

(These are wording proposals — open to your edits.)

---

## 3. Player-facing structure

### 3.1 The four loops

| Loop | Time scale | What happens | How it pulls the player back |
|---|---|---|---|
| **Tap loop** | seconds | Tap a hive → small instant honey burst (with cap). Long-press → see stats. | "I have 30 seconds at the bus stop." |
| **Claim loop** | hours (12h) | Cooldown claim of all accumulated production. | Push notification when ready. |
| **Build loop** | days | Save resources → place / upgrade buildings → unlock skins. | "I almost have enough for the Solar L3." |
| **Royal loop** | weeks | Compete on leaderboard, mint skins, earn season rewards. | "I dropped from rank #14 to #19 — fight back." |

We already have claim + build. We need to add **tap loop** and **royal loop**
properly to give the game shape.

### 3.2 Visible long-term goal

Add a `Royal Hive` progression bar to Home:

```
🐝 Worker Apiary
[██████░░░░░░░░░░░░░░] 6 / 20 colony level
Next: Queen's Court (lvl 7)
```

Colony level is computed from `sum of all building levels`. Displaying it
turns the abstract progression into something the player can *see* moving.

### 3.3 Daily quests

A small quest panel on Home, reset 04:00 local:

- "Build any 1 hive"
- "Upgrade any building once"
- "Claim today's honey"
- "Beat your previous claim record"

Reward: bonus honey + streak counter.

### 3.4 Login streak

Visual badge on Home: `🔥 3-day streak` with a 7-day pip strip. Day 7 = chest
of honey. Day 30 = guaranteed cosmetic skin. We already have notifications,
just need the UI.

### 3.5 Urgency mechanics (without being toxic)

Cozy idle ≠ mobile-gacha rage. We add **gentle** urgency:

- **Storage cap bar already added.** Add a soft warning when ≥85%: "🍯 Vault
  almost full — claim before you lose income." Soft toast.
- **Energy starvation:** if energy/water ratio is too low for too long, hives
  produce at 50% — a status badge on Home: "⚠️ Hives starving — build a Farm".
- **Seasonal bloom (24h limited event):** every 5 days a 24-hour 1.5× bloom
  multiplier triggers. Push notification. Players who play during bloom feel
  rewarded.
- **No "lose progress if you don't play" mechanics.** Cozy means safe.

### 3.6 Competition (already half-built)

We have a leaderboard. Make it sting:

- On home: "Your rank: **#42** out of 1,283" badge.
- Weekly snapshot: "+5 / -3" since last Monday.
- Top 100 frame on Royal Leaderboard.
- Optional: rank-up toast: "🏆 You climbed to #38!"

### 3.7 End goal

For the Solana dApp Store version, the "ending" is **Queen's Court** at colony
level 30: all 9 slots upgraded to L5+, full set of cNFT skins, and a permanent
title of "Royal Apiarist" tied to the wallet. That title is the soft-end —
seasons reset competitive ranks but keep the title.

---

## 4. Concrete UI changes proposed

(These would be PR-3 if approved.)

1. **Home screen header rework** — replace bee illustration with a *narrative*
   block: queen avatar, colony name (auto-generated, editable), colony level
   bar, today's quest summary, current rank.
2. **First-run forced tutorial** — instead of empty 9-slot grid, drop the user
   into the colony with a glowing slot that says "Tap me first" and a single
   call-to-action: place your first hive. Celebrate with confetti + first-build
   toast.
3. **Always-visible "What's next" card** — looks at colony state and proposes
   one concrete action: "Place a Solar Panel — your hives need power" or
   "Upgrade Bee Hive #1 to L2 — 60🍯 + 30⚡".
4. **Daily quest strip** above the grid in the colony screen.
5. **Bloom event banner** on home when a seasonal event is active.
6. **Leaderboard rank badge** on home + weekly delta.
7. **Profile screen colony naming + avatar choice** — small but boosts attachment.

---

## 5. Localization (i18n) plan

### 5.1 Languages — proposal

Targeting Solana Mobile + Web3 mobile audience, top languages by user share are:

| Priority | Locale | Rationale |
|---|---|---|
| P0 | `en` | source of truth |
| P0 | `ru` | requested |
| P0 | `uk` | requested |
| P1 | `es` | huge mobile gaming + LATAM Web3 |
| P1 | `pt` | Brazil is top Web3 mobile market |
| P1 | `zh-Hans` | largest crypto-mobile audience |
| P1 | `id` | Indonesia is a top idle-game market |
| P2 | `tr` | strong crypto + idle audience |
| P2 | `vi` | top Web3 mobile country per token volume |
| P2 | `de` | DACH stable buyers |
| P2 | `fr` | EU coverage |

**Recommendation: ship P0+P1 (7 locales) first; add P2 in PR-4.** That's the
"5-7 most popular" you asked for and includes both Russian and Ukrainian.

### 5.2 Tech choice

- **`i18next` + `react-i18next`** — industry standard, RN-supported, lazy-load
  support.
- **`expo-localization`** — for device locale detection + RTL flag.
- **JSON translation files** under `locales/<lang>/common.json`.
- **Auto-detection on first launch**, with a manual override in Profile.
- **All hardcoded strings** migrated to `t("home.greeting")` style. We already
  have ~120 strings — manageable in one pass.

### 5.3 Translation source

Two options:

- **(a) Auto-translate (DeepL or Google) + human review** — fastest. I can do
  this in one PR. Quality good enough for game text, you (or community) refine
  later.
- **(b) You provide translators / community PRs.** Slower, higher quality.

Recommend (a) with a clear "machine-translated" disclaimer in Profile, and
later replace each language as humans review.

---

## 6. Suggested implementation phases

I want to keep PR sizes small and shippable so you can test each on Seeker.

### PR-3 — Game design v2 core (this is the biggest one, ~6-8h work)
- Story-driven copy (English only, but extracted to i18n keys from the start)
- Home screen narrative rework (avatar / level bar / "what's next" / rank)
- Forced first-build tutorial
- Daily quests (server-less, local with quest reset cron)
- Login streak counter + visual
- Storage warning toast at 85%
- Hive starvation badge
- Rank delta on home

### PR-4 — i18n foundation + 7 languages
- i18next + expo-localization + JSON pipeline
- Migrate all strings
- Auto-translate P0+P1 (7 locales)
- Locale switch in Profile

### PR-5 — Royal loop / events (Phase A.2)
- Seasonal bloom event (24h x1.5 bloom)
- Weekly leaderboard reset
- Cosmetic season banner
- "Royal Apiarist" title on cap

### PR-6 (Phase B) — anti-cheat & SIWS
- Sign-In With Solana (already in our backlog)
- Server-side claim validation
- Daily quest verification server-side

---

## 7. Decisions I need before coding

Please answer these — short answers fine:

1. **Story direction** — do you like *The Last Apiary / queen-rebuilds* framing,
   or do you want something else (e.g. fantasy kingdom, alien hive, post-apoc)?
2. **Wording** — OK with renaming surface things ("Pledge to the Queen", "Honey
   Vault", "Forge Regalia") or keep neutral ("Connect Wallet", "Rewards", "Mint
   Skin")?
3. **Languages** — accept the 7-locale plan (en / ru / uk / es / pt / zh / id)
   or different list?
4. **Translation source** — auto-translate now and refine later (recommended),
   or wait for human translators?
5. **Phase order** — do PR-3 (game design) then PR-4 (i18n)? Or i18n first so
   English copy ships in all 7 languages from PR-3 onward? **Recommend
   reversing**: PR-3a = i18n scaffolding (no language files yet), PR-3b = full
   game design with all strings already i18n-keyed, PR-3c = the 7 translation
   files. That way no string is ever hard-coded.

---

## 8. Out of scope (explicit non-goals)

- Real-money microtransactions / IAP — this is a Web3 cozy idle, not a
  pay-to-win clone.
- PvP combat — competition is rank-based only.
- Real-time multiplayer — too heavy for MVP.
- Full Bubblegum on-chain mint — already deferred to Phase B.
- iOS — Solana Mobile dApp Store is Android-only for now.

---

## 9. Open risks

- **Game design risk:** I am not a professional game designer. The loops above
  are based on common idle-game patterns; the actual fun-tuning will need
  iteration (probably 2-3 EAS builds of testing).
- **i18n risk:** machine translation quality varies; Ukrainian + Russian I can
  partially review myself, others will need community polish.
- **Build slot risk:** we have ~10 EAS builds left this month. PR-3 + PR-4 will
  take ~3-4 builds to tune. Tight but feasible.
