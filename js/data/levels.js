import { GAME_CONFIG } from "../config.js?v=phase09-endings-r1";

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
    typeof semanticDefinition.hudLabel !== "string" ||
    typeof semanticDefinition.minimapPathId !== "string" ||
    typeof semanticDefinition.transfer?.fromChamber !== "string" ||
    typeof semanticDefinition.transfer?.toChamber !== "string" ||
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
    hudLabel: "SYSTEMIC / LOWER",
    circulationType: "SYSTEMIC",
    minimapPathId: "systemic-lower-circulation-path",
    gasExchangeType: "OXYGEN_TO_TISSUE_CARBON_DIOXIDE_FROM_TISSUE",
    startLocationLabel: "左心室",
    endLocationLabel: "右心室",
    transfer: {
      fromChamber: "右心房",
      toChamber: "右心室"
    },
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
  },
  2: {
    name: "肺循環",
    hudLabel: "PULMONARY",
    circulationType: "PULMONARY",
    minimapPathId: "pulmonary-circulation-path",
    gasExchangeType: "CARBON_DIOXIDE_TO_ALVEOLI_OXYGEN_FROM_ALVEOLI",
    startLocationLabel: "右心室",
    endLocationLabel: "左心室",
    transfer: {
      fromChamber: "左心房",
      toChamber: "左心室"
    },
    sections: [
      {
        id: "right-ventricle",
        locationLabel: "右心室",
        minimapSegmentId: "right-ventricle"
      },
      {
        id: "pulmonary-artery",
        locationLabel: "肺動脈",
        minimapSegmentId: "pulmonary-artery"
      },
      {
        id: "alveolar-capillary",
        locationLabel: "肺泡微血管",
        minimapSegmentId: "alveolar-capillary",
        gasExchangeZone: "PULMONARY_ALVEOLI"
      },
      {
        id: "pulmonary-vein",
        locationLabel: "肺靜脈",
        minimapSegmentId: "pulmonary-vein"
      },
      {
        id: "left-heart",
        locationLabel: "左心房／左心室",
        minimapSegmentId: "left-heart"
      }
    ]
  },
  3: {
    name: "體循環－上半身與腦",
    hudLabel: "SYSTEMIC / UPPER",
    circulationType: "SYSTEMIC",
    minimapPathId: "systemic-upper-circulation-path",
    gasExchangeType: "OXYGEN_TO_TISSUE_CARBON_DIOXIDE_FROM_TISSUE",
    startLocationLabel: "左心室",
    endLocationLabel: "右心室",
    transfer: {
      fromChamber: "右心房",
      toChamber: "右心室"
    },
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
        id: "carotid-subclavian-arteries",
        locationLabel: "頸動脈／鎖骨下動脈",
        minimapSegmentId: "carotid-subclavian-arteries"
      },
      {
        id: "upper-body-arteriole",
        locationLabel: "上半身小動脈",
        minimapSegmentId: "upper-body-arteriole"
      },
      {
        id: "brain-upper-capillary",
        locationLabel: "腦／上半身微血管",
        minimapSegmentId: "brain-upper-capillary",
        gasExchangeZone: "SYSTEMIC_BRAIN_UPPER_TISSUE"
      },
      {
        id: "venule",
        locationLabel: "小靜脈",
        minimapSegmentId: "venule"
      },
      {
        id: "superior-vena-cava",
        locationLabel: "上大靜脈",
        minimapSegmentId: "superior-vena-cava"
      },
      {
        id: "right-heart",
        locationLabel: "右心房／右心室",
        minimapSegmentId: "right-heart"
      }
    ]
  },
  4: {
    name: "高風險肺循環",
    hudLabel: "PULMONARY / HIGH RISK",
    circulationType: "PULMONARY",
    minimapPathId: "high-risk-pulmonary-circulation-path",
    gasExchangeType: "CARBON_DIOXIDE_TO_ALVEOLI_OXYGEN_FROM_ALVEOLI",
    startLocationLabel: "右心室",
    endLocationLabel: "左心室",
    transfer: {
      fromChamber: "左心房",
      toChamber: "左心室"
    },
    sections: [
      {
        id: "right-ventricle",
        locationLabel: "右心室",
        minimapSegmentId: "right-ventricle"
      },
      {
        id: "pulmonary-artery",
        locationLabel: "肺動脈",
        minimapSegmentId: "pulmonary-artery"
      },
      {
        id: "alveolar-capillary",
        locationLabel: "肺泡微血管",
        minimapSegmentId: "alveolar-capillary",
        gasExchangeZone: "PULMONARY_ALVEOLI"
      },
      {
        id: "pulmonary-vein",
        locationLabel: "肺靜脈",
        minimapSegmentId: "pulmonary-vein"
      },
      {
        id: "left-heart",
        locationLabel: "左心房／左心室",
        minimapSegmentId: "left-heart"
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
    hudLabel: semanticDefinition.hudLabel,
    circulationType: semanticDefinition.circulationType,
    minimapPathId: semanticDefinition.minimapPathId,
    gasExchangeType: semanticDefinition.gasExchangeType,
    transfer: semanticDefinition.transfer,
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

export const LEVELS = deepFreeze(
  Object.keys(LEVEL_SEMANTICS).map((levelId) =>
    assembleLevel(levelId, LEVEL_SEMANTICS[levelId])
  )
);

export function getLevelById(levelId) {
  return LEVELS.find((level) => level.id === Number(levelId)) ?? null;
}
