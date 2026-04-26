import type { BuildingDefinition, BuildingKind, Resources } from "@/types";

export const RESOURCE_LABEL: Record<keyof Resources, string> = {
  honey: "Honey",
  energy: "Energy",
  food: "Food",
  water: "Water",
};

export const RESOURCE_EMOJI: Record<keyof Resources, string> = {
  honey: "🍯",
  energy: "⚡",
  food: "🌾",
  water: "💧",
};

export const RESOURCE_COLOR: Record<keyof Resources, string> = {
  honey: "#FFC940",
  energy: "#FFAA3A",
  food: "#A5E36F",
  water: "#7DD3FC",
};

/** Base cap shared by all resources. Storage buildings add to this. */
export const BASE_RESOURCE_CAP = 200;

/** Maximum hours of accumulation if player never logs in. */
export const MAX_OFFLINE_HOURS = 48;

/** Cooldown between claims (hours). */
export const CLAIM_COOLDOWN_HOURS = 12;

export const BUILDINGS: Record<BuildingKind, BuildingDefinition> = {
  bee_hive: {
    kind: "bee_hive",
    name: "Bee Hive",
    emoji: "🐝",
    description: "Buzzing producer of sweet honey.",
    produces: "honey",
    baseProductionPerHour: 6,
    levelMultiplier: 1.45,
    baseCost: { honey: 0, food: 10, water: 5 },
    costMultiplier: 1.7,
    maxLevel: 5,
    skinUnlockLevel: 3,
    skinBonus: 0.1,
  },
  solar_panel: {
    kind: "solar_panel",
    name: "Solar Panel",
    emoji: "☀️",
    description: "Captures sunlight as energy.",
    produces: "energy",
    baseProductionPerHour: 8,
    levelMultiplier: 1.4,
    baseCost: { energy: 0, food: 8, water: 4 },
    costMultiplier: 1.7,
    maxLevel: 5,
    skinUnlockLevel: 3,
    skinBonus: 0.1,
  },
  small_farm: {
    kind: "small_farm",
    name: "Small Farm",
    emoji: "🌾",
    description: "Hand-tended crops feed the colony.",
    produces: "food",
    baseProductionPerHour: 8,
    levelMultiplier: 1.4,
    baseCost: { water: 6, energy: 4 },
    costMultiplier: 1.7,
    maxLevel: 5,
    skinUnlockLevel: 3,
    skinBonus: 0.1,
  },
  water_collector: {
    kind: "water_collector",
    name: "Water Collector",
    emoji: "💧",
    description: "Pulls fresh water from the air.",
    produces: "water",
    baseProductionPerHour: 12,
    levelMultiplier: 1.4,
    baseCost: { energy: 6, food: 4 },
    costMultiplier: 1.7,
    maxLevel: 5,
    skinUnlockLevel: 3,
    skinBonus: 0.1,
  },
  storage: {
    kind: "storage",
    name: "Storage",
    emoji: "📦",
    description: "Increases your max resource cap.",
    produces: null,
    baseProductionPerHour: 0,
    levelMultiplier: 1,
    storageBonusPerLevel: 200,
    baseCost: { honey: 8, food: 8, energy: 8, water: 8 },
    costMultiplier: 1.8,
    maxLevel: 5,
    skinUnlockLevel: 3,
    skinBonus: 0,
  },
  research_lab: {
    kind: "research_lab",
    name: "Research Lab",
    emoji: "🧪",
    description: "Boosts colony-wide production.",
    produces: null,
    baseProductionPerHour: 0,
    levelMultiplier: 1,
    researchBoostPerLevel: 0.05, // +5% per level
    baseCost: { honey: 12, energy: 12, food: 8, water: 8 },
    costMultiplier: 1.9,
    maxLevel: 5,
    skinUnlockLevel: 4,
    skinBonus: 0.05,
  },
};

export const ALL_BUILDING_KINDS: BuildingKind[] = Object.keys(
  BUILDINGS,
) as BuildingKind[];
