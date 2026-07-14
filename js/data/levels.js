import { GAME_CONFIG } from "../config.js?v=phase07-status-r2";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }

  return value;
}

function validateLevelDefinition(tuning, semanticDefinition) {
  if (
    !semanticDefinition ||
    typeof semanticDefinition.name !== "string" ||
    typeof semanticDefinition.minimapPathId !== "string" ||
    !Array.isArray(semanticDefinition.sections)
  ) {
    throw new TypeError("A level semantic definition is required.");
  }

  if (!Array.isArray(tuning.routeSections)) {
    throw new TypeError("The configured level has no playable route data.");
  }

  if (semanticDefinition.sections.length !== tuning.routeSections.length) {
    throw new RangeError(
      "Semantic section count must match configured route sections."
    );
  }

  if (!Array.isArray(tuning.controlPoints) || tuning.controlPoints.length < 2) {
    throw new RangeError("A playable level requires at least two control points.");
  }

  let expectedDistance = tuning.startDistance;
  let expectedMinimapProgress = 0;

  tuning.routeSections.forEach((section) => {
    if (
      section.startDistance !== expectedDistance ||
      section.endDistance <= section.startDistance ||
      section.radius <= 0 ||
      section.minimapStartProgress !== expectedMinimapProgress ||
      section.minimapEndProgress <= section.minimapStartProgress ||
      section.minimapEndProgress > 1 ||
      !Object.hasOwn(GAME_CONFIG.palette, section.colorStartKey) ||
      !Object.hasOwn(GAME_CONFIG.palette, section.colorEndKey)
    ) {
      throw new RangeError("Configured route sections must be contiguous and valid.");
    }

    expectedDistance = section.endDistance;
    expectedMinimapProgress = section.minimapEndProgress;
  });

  if (
    expectedDistance !== tuning.endDistance ||
    tuning.endDistance !== tuning.trackLength ||
    expectedMinimapProgress !== 1
  ) {
    throw new RangeError("Configured route must span the level and minimap path.");
  }
}

export const LEVEL_SEMANTICS = deepFreeze({
  1: {
    name: "體循環－下半身",
    circulationType: "SYSTEMIC",
    minimapPathId: "systemic-lower-circulation-path",
    gasExchangeType: "OXYGEN_TO_TISSUE_CARBON_DIOXIDE_FROM_TISSUE",
    startLocationLabel: "左心室",
    endLocationLabel: "右心室",
    sections: [
      {
        id: "left-ventricle",
        locationLabel: "左心室",
        minimapSegmentId: "left-ventricle"
      },
      {
        id: "aorta",
        locationLabel: "主動脈",
        minimapSegmentId: "aorta"
      },
      {
        id: "descending-aorta",
        locationLabel: "降主動脈",
        minimapSegmentId: "descending-aorta"
      },
      {
        id: "lower-body-arteriole",
        locationLabel: "下半身小動脈",
        minimapSegmentId: "lower-body-arteriole"
      },
      {
        id: "tissue-capillary",
        locationLabel: "組織微血管",
        minimapSegmentId: "tissue-capillary",
        gasExchangeZone: "SYSTEMIC_TISSUE"
      },
      {
        id: "venule",
        locationLabel: "小靜脈",
        minimapSegmentId: "venule"
      },
      {
        id: "inferior-vena-cava",
        locationLabel: "下大靜脈",
        minimapSegmentId: "inferior-vena-cava"
      },
      {
        id: "right-heart",
        locationLabel: "右心房／右心室",
        minimapSegmentId: "right-heart"
      }
    ]
  }
});

export function assembleLevel(levelId, semanticDefinition) {
  const tuning = GAME_CONFIG.levels[levelId];

  if (!tuning) {
    throw new RangeError("Unknown level id: " + levelId);
  }

  validateLevelDefinition(tuning, semanticDefinition);

  const sections = semanticDefinition.sections.map((semantic, index) => {
    const configured = tuning.routeSections[index];

    return Object.freeze({
      ...semantic,
      ...configured,
      startRatio: configured.startDistance / tuning.trackLength,
      endRatio: configured.endDistance / tuning.trackLength,
      colorStart: GAME_CONFIG.palette[configured.colorStartKey],
      colorEnd: GAME_CONFIG.palette[configured.colorEndKey]
    });
  });
  const gasTriggerDistances = Object.fromEntries(
    Object.entries(tuning.gasTriggerRatios).map(([key, ratio]) => [
      key,
      ratio * tuning.trackLength
    ])
  );

  return deepFreeze({
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
    gasTriggerDistances,
    start: {
      distance: tuning.startDistance,
      locationLabel: semanticDefinition.startLocationLabel
    },
    end: {
      distance: tuning.endDistance,
      locationLabel: semanticDefinition.endLocationLabel
    },
    sections,
    multipliers: tuning.multipliers,
    highRisk: tuning.highRisk
  });
}

export const LEVELS = deepFreeze([
  assembleLevel(1, LEVEL_SEMANTICS[1])
]);

export function getLevelById(levelId) {
  return LEVELS.find((level) => level.id === Number(levelId)) ?? null;
}
