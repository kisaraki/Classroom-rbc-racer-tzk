import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }

  return value;
}

export const ENTITY_CATEGORIES = Object.freeze({
  BUFF: "BUFF",
  DEBUFF: "DEBUFF",
  FATAL: "FATAL"
});

export const ENTITY_TRIGGERS = Object.freeze({
  MALARIA_HOOD: "MALARIA_HOOD",
  WOUND: "WOUND"
});

export const ENTITY_TYPE_SEMANTICS = deepFreeze({
  vitaminC: {
    displayName: "維生素 C",
    label: "C",
    category: ENTITY_CATEGORIES.BUFF,
    modelKey: "vitaminC"
  },
  vitaminB12: {
    displayName: "維生素 B12",
    label: "B12",
    category: ENTITY_CATEGORIES.BUFF,
    modelKey: "vitaminB12"
  },
  iron: {
    displayName: "鐵離子",
    label: "Fe²⁺",
    category: ENTITY_CATEGORIES.BUFF,
    modelKey: "iron"
  },
  carbonMonoxide: {
    displayName: "一氧化碳",
    label: "CO",
    category: ENTITY_CATEGORIES.DEBUFF,
    modelKey: "carbonMonoxide",
    counterKey: "carbonMonoxideCount"
  },
  malaria: {
    displayName: "瘧原蟲",
    label: "",
    category: ENTITY_CATEGORIES.DEBUFF,
    modelKey: "malaria",
    counterKey: "malariaCount",
    trigger: ENTITY_TRIGGERS.MALARIA_HOOD
  },
  alcohol: {
    displayName: "酒精",
    label: "C₂H₅OH",
    category: ENTITY_CATEGORIES.DEBUFF,
    modelKey: "alcohol",
    counterKey: "alcoholCount",
    weightMultiplierKey: "alcohol"
  },
  wound: {
    displayName: "血管破口",
    label: "Wound",
    category: ENTITY_CATEGORIES.FATAL,
    modelKey: "wound",
    trigger: ENTITY_TRIGGERS.WOUND
  }
});

export const GENERAL_SPAWN_TYPE_IDS = Object.freeze([
  "vitaminC",
  "vitaminB12",
  "iron",
  "carbonMonoxide",
  "malaria",
  "alcohol",
  "empty"
]);

export function assembleEntityType(typeId, semanticDefinition) {
  const tuning = GAME_CONFIG.entityTypes[typeId];

  if (!tuning) {
    throw new RangeError("Unknown entity type id: " + typeId);
  }

  if (
    !semanticDefinition ||
    typeof semanticDefinition.displayName !== "string" ||
    typeof semanticDefinition.label !== "string" ||
    !Object.values(ENTITY_CATEGORIES).includes(semanticDefinition.category) ||
    typeof semanticDefinition.modelKey !== "string"
  ) {
    throw new TypeError("A complete entity semantic definition is required.");
  }

  if (!GAME_CONFIG.entityVisuals.models[semanticDefinition.modelKey]) {
    throw new RangeError("Unknown procedural model key: " + semanticDefinition.modelKey);
  }

  return deepFreeze({
    id: typeId,
    ...semanticDefinition,
    tuning
  });
}

export const ENTITY_TYPES = Object.freeze(
  Object.entries(ENTITY_TYPE_SEMANTICS).map(([typeId, semantic]) =>
    assembleEntityType(typeId, semantic)
  )
);

const ENTITY_TYPES_BY_ID = new Map(
  ENTITY_TYPES.map((entityType) => [entityType.id, entityType])
);

export function getEntityType(typeId) {
  return ENTITY_TYPES_BY_ID.get(typeId) ?? null;
}
