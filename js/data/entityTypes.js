import { GAME_CONFIG } from "../config.js";

// Visual and educational semantics are added with the entity implementation.
export const ENTITY_TYPE_SEMANTICS = Object.freeze({});
export const ENTITY_TYPES = Object.freeze([]);

export function assembleEntityType(typeId, semanticDefinition) {
  const tuning = GAME_CONFIG.entityTypes[typeId];

  if (!tuning) {
    throw new RangeError("Unknown entity type id: " + typeId);
  }

  if (!semanticDefinition || typeof semanticDefinition.label !== "string") {
    throw new TypeError("An entity semantic definition is required.");
  }

  return Object.freeze({
    id: typeId,
    ...semanticDefinition,
    tuning
  });
}
