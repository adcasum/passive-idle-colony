export type ResourceKind = "honey" | "energy" | "food" | "water";

export type Resources = Record<ResourceKind, number>;

export type BuildingKind =
  | "bee_hive"
  | "solar_panel"
  | "small_farm"
  | "water_collector"
  | "storage"
  | "research_lab";

export interface BuildingDefinition {
  kind: BuildingKind;
  name: string;
  emoji: string;
  description: string;
  /** Primary resource produced (storage/research_lab can be null). */
  produces: ResourceKind | null;
  /** Production at level 1, units / hour. */
  baseProductionPerHour: number;
  /** Multiplier per level: prod = base * (levelMultiplier ^ (level-1)). */
  levelMultiplier: number;
  /** Storage adds N to all-resource cap per level. */
  storageBonusPerLevel?: number;
  /** Research lab adds % production boost per level (0.10 => +10%). */
  researchBoostPerLevel?: number;
  /** Cost to build at level 1. */
  baseCost: Partial<Resources>;
  /** Per-upgrade cost growth: cost(level) = baseCost * (costMultiplier ^ (level-1)). */
  costMultiplier: number;
  /** Max upgrade level. */
  maxLevel: number;
  /** Skin (cNFT) unlock unlocks at this level. */
  skinUnlockLevel: number;
  /** Bonus to production when a skin is equipped (0.10 => +10%). */
  skinBonus: number;
}

export interface Building {
  id: string;
  kind: BuildingKind;
  level: number;
  /** Mint address of equipped cNFT skin, if any. */
  skinMint?: string | null;
}

export type Slot = Building | null;

export interface ColonyState {
  /** 9 slots, index 0..8 (3x3). */
  slots: Slot[];
  resources: Resources;
  /** ms epoch of last claim/tick application. */
  lastClaimAt: number;
  /** ms epoch the colony was created. */
  createdAt: number;
}

export interface DailyClaimResult {
  hours: number;
  produced: Resources;
  cappedAt: Resources;
}
