import { GAME_CONFIG } from "../config.js";

// Route semantics are populated only in the phases that authorize each level.
export const LEVEL_SEMANTICS = Object.freeze({});
export const LEVELS = Object.freeze([]);

export function assembleLevel(levelId, semanticDefinition) {
  const tuning = GAME_CONFIG.levels[levelId];

  if (!tuning) {
    throw new RangeError("Unknown level id: " + levelId);
  }

  if (
    !semanticDefinition ||
    typeof semanticDefinition.name !== "string" ||
    typeof semanticDefinition.minimapPathId !== "string" ||
    !Array.isArray(semanticDefinition.sections)
  ) {
    throw new TypeError("A level semantic definition is required.");
  }

  if (semanticDefinition.sections.length !== tuning.sectionRatios.length) {
    throw new RangeError(
      "Semantic section count must match configured section ratios."
    );
  }

  const sections = semanticDefinition.sections.map((section, index) =>
    Object.freeze({
      ...section,
      ratio: tuning.sectionRatios[index]
    })
  );

  return Object.freeze({
    id: Number(levelId),
    name: semanticDefinition.name,
    circulationType: semanticDefinition.circulationType,
    minimapPathId: semanticDefinition.minimapPathId,
    gasExchangeType: semanticDefinition.gasExchangeType,
    targetDriveSeconds: tuning.targetDriveSeconds,
    trackLength: tuning.trackLength,
    seed: tuning.seed,
    controlPoints: tuning.controlPoints,
    gasTriggerRatios: tuning.gasTriggerRatios,
    sections: Object.freeze(sections),
    multipliers: tuning.multipliers,
    highRisk: tuning.highRisk
  });
}
