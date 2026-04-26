# Passive Idle Colony

A cozy passive-idle simulator for the **Solana Mobile dApp Store** (Seeker / Saga / Android), built with React Native + Expo + Solana Mobile Stack.

> **Status:** MVP (v0.1.0)
> **Target:** Android / Solana Mobile devices (Seeker, Saga)
> **Network:** Devnet by default, mainnet-ready
> **Assets:** Compressed NFT cosmetics via Metaplex Bubblegum

---

## What it does

- 3×3 colony grid: place 6 building types (bee hive, solar panel, farm, water collector, storage, research lab).
- Buildings produce **honey, energy, food, water** continuously — even while the app is closed.
- Daily claim flow with on-cooldown timer, history, and push notification when the colony is ready.
- Upgrade buildings with collected resources. At a threshold level you can mint a **compressed NFT skin** that gives a small production bonus.
- Wallet auth via **Solana Mobile Wallet Adapter** (Seed Vault on Seeker, regular MWA on other devices).
- Dark, Phantom-inspired UI with NativeWind + Reanimated.

---

## Tech stack

| Library                        | Why                                            |
| ------------------------------ | ---------------------------------------------- |
| Expo SDK 52 + Expo Router      | App framework + file-based navigation          |
| React Native 0.76              | Mobile runtime                                 |
| NativeWind 4 + Tailwind        | Styling, dark theme                            |
| Reanimated 3 + Gesture Handler | Smooth animations (resource ticks, slot pops)  |
| Zustand + AsyncStorage persist | Game state (colony, resources, rewards)        |
| TanStack Query                 | Async caching for wallet/RPC reads             |
| @solana-mobile/...             | MWA + Seed Vault wallet auth                   |
| @solana/web3.js                | Connection / balance reads                     |
| @metaplex-foundation/mpl-bubblegum + umi | cNFT mint                            |
| Expo Notifications             | "Your colony is ready" reminder push           |

---

## Project layout

```
passive-idle-colony/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Providers, polyfills, query client, theme
│   ├── index.tsx                 # Home / landing
│   ├── colony/index.tsx          # Main colony screen with 3x3 grid
│   ├── rewards/index.tsx         # Claim history + total
│   ├── mint/index.tsx            # cNFT skin mint flow
│   └── profile/index.tsx         # Wallet, balance, danger zone
├── components/
│   ├── Colony/{Grid,Slot,BuildingCard}.tsx
│   ├── UI/{Button,Card,AnimatedResource}.tsx
│   └── Shared/WalletConnectButton.tsx
├── store/                        # Zustand
│   ├── colonyStore.ts            # Slots, resources, claim, upgrade
│   ├── walletStore.ts            # MWA authorization state
│   └── rewardsStore.ts           # Claim history
├── hooks/{useColonyData,useWallet,useDailyClaim,useMintSkin}.ts
├── lib/                          # Pure logic / SDK glue
│   ├── colonyMath.ts             # Production / cap / claim math
│   ├── walletAuth.ts             # MWA authorize/deauthorize
│   ├── solana.ts                 # Connection + RPC config
│   ├── metaplex.ts               # Umi + Bubblegum
│   ├── notifications.ts          # Expo Notifications scheduling
│   ├── format.ts                 # fmtNum, ellipsify
│   └── polyfills.ts              # Buffer, crypto.getRandomValues
├── constants/buildings.ts        # Building config (production, cost, levels)
├── types/index.ts                # Shared TS types
├── scripts/createBubblegumTree.ts # One-time tree setup
├── app.json                      # Expo config
├── eas.json                      # EAS Build profiles
└── tailwind.config.js
```

---

## Quick start (dev)

> Requires Node 20+, an Expo account, and an Android device (Seeker recommended) **or** an emulator with an MWA-compatible wallet (e.g. fakewallet, Phantom).

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# Set EXPO_PUBLIC_RPC_URL (Helius free tier or devnet public RPC)

# 3. Build a custom dev client (one-time)
#    Solana Mobile apps cannot run in Expo Go.
npx eas build --profile development --platform android
# OR locally:
npx eas build --profile development --platform android --local

# 4. Install the resulting APK on your device, then start the dev server:
npm run start
```

Inside the dev client app, scan the QR / paste the URL to load the JS bundle.

---

## Building APKs

```bash
# Internal preview APK (sideload-friendly)
npm run build:preview

# Production app bundle (.aab) for the dApp Store
npm run build:prod
```

EAS will prompt you to log in / configure credentials on first run.

To run non-interactively in CI, set `EXPO_TOKEN` (from `https://expo.dev/accounts/<you>/settings/access-tokens`).

---

## Bubblegum tree (cNFT mint)

Compressed NFT minting requires a one-time Bubblegum Merkle tree. Set up on a workstation (not on the phone):

```bash
# Generate / fund a devnet keypair if you don't have one:
solana-keygen new -o ~/.config/solana/devnet.json
solana airdrop 2 --url devnet

# Run the helper:
SOLANA_KEYPAIR_PATH=~/.config/solana/devnet.json \
RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY \
npx ts-node scripts/createBubblegumTree.ts

# It prints something like:
#   Set:
#     EXPO_PUBLIC_BUBBLEGUM_TREE=8x...
```

Add that to `.env` (and as an EAS env variable for production builds). On next launch the mint screen will switch from "Local placeholder" to "On-chain (Bubblegum)" mode.

> The MVP currently mints to a **local pseudo-mint id** when no tree is configured, so the gameplay loop and skin bonus still work end-to-end before you set up the tree.

---

## Game design recap

- **9 slots** in a 3×3 grid; each slot holds at most one building.
- 6 building types: **bee_hive, solar_panel, small_farm, water_collector, storage, research_lab**.
- Buildings level 1 → 5; cost grows ~1.7×/level; production grows ~1.4×/level.
- Resources cap at `BASE_RESOURCE_CAP (200) + storage bonus`; offline accrual capped at **48h**.
- Claim cooldown: **12h** (configurable in `constants/buildings.ts`).
- Skin unlocks at level 3 (4 for research lab); +10% production (or +5% global for research).
- All math: `lib/colonyMath.ts`.

---

## On-chain integration

This MVP is intentionally **light on-chain** so it's shippable in 7–10 days:

| Feature                  | On-chain                          | Off-chain                    |
| ------------------------ | --------------------------------- | ---------------------------- |
| Wallet auth              | ✅ MWA / Seed Vault                | Auth token cached locally    |
| SOL balance display      | ✅ via `Connection.getBalance`     | —                            |
| Game state (resources)   | —                                 | AsyncStorage (Zustand persist) |
| Daily claim timestamp    | —                                 | Local + can be lifted to a PDA later |
| cNFT skins               | ✅ Bubblegum (compressed) when tree set | Local placeholder otherwise |

A future v0.2 could add an Anchor program with a `colony` PDA storing `lastClaimAt` + resources for cross-device sync.

---

## Submitting to the dApp Store

1. Run `npm run build:prod` to produce a signed `.aab`.
2. Verify on a real Solana Mobile device (Seeker / Saga).
3. Generate screenshots from your device (in-app screens 1280×720 or larger).
4. Follow the Solana Mobile dApp Store publisher guide: https://docs.solanamobile.com/dapp-publishing/intro
   - Create a publisher and app NFT.
   - Submit the release with the `.aab` and metadata.

---

## Development tips

- Reset state from the **Profile** screen for fast iteration.
- Game tick math is in `lib/colonyMath.ts` and is pure — easy to unit-test.
- Notifications schedule via `lib/notifications.ts`. They no-op on simulators (Expo Notifications requires a real device).
- The store uses `zustand/persist` with AsyncStorage; bump the storage key (`passive-idle-colony:v1`) when you make breaking schema changes.

---

## Roadmap (post-MVP)

- Anchor program for on-chain claim / resource state (PDA).
- Real cNFT mint flow signed via MWA (currently stubbed when tree is set).
- Tutorial / onboarding pass.
- Sound design + more skins.
- Optional friends / leaderboard.

---

## License

MIT
