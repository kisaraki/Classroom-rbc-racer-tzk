import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

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
    name: "體循環（腹部及下肢）",
    hudLabel: "體循環 / SYSTEMIC",
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
        locationLabel: "主動脈分支（腹部及下肢）",
        minimapSegmentId: "descending-aorta"
      },
      {
        id: "lower-body-arteriole",
        locationLabel: "腹部及下肢的小動脈",
        minimapSegmentId: "lower-body-arteriole"
      },
      {
        id: "tissue-capillary",
        locationLabel: "腹部及下肢的微血管網",
        minimapSegmentId: "tissue-capillary",
        gasExchangeZone: "TISSUE"
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
    hudLabel: "肺循環 / PULMONARY",
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
        gasExchangeZone: "LUNG"
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
    name: "體循環（頭部、胸部及上肢）",
    hudLabel: "體循環 / SYSTEMIC",
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
        locationLabel: "頭部、胸部及上肢的小動脈",
        minimapSegmentId: "upper-body-arteriole"
      },
      {
        id: "brain-upper-capillary",
        locationLabel: "頭部、胸部及上肢的微血管網",
        minimapSegmentId: "brain-upper-capillary",
        gasExchangeZone: "TISSUE"
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
    name: "肺循環（高危險關卡）",
    hudLabel: "肺循環 / PULMONARY",
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
        gasExchangeZone: "LUNG"
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
  const exchangeSections = sections.filter(
    (section) => section.gasExchangeZone !== undefined
  );

  if (exchangeSections.length !== 1) {
    throw new RangeError(
      "A level must define exactly one tissue or lung exchange section."
    );
  }

  const exchangeSection = exchangeSections[0];
  const exchangeRegion = exchangeSection.gasExchangeZone;
  const opportunityCount =
    GAME_CONFIG.qte.opportunityCountByRegion[exchangeRegion];

  if (!Number.isInteger(opportunityCount) || opportunityCount <= 0) {
    throw new RangeError(
      "The exchange region requires a configured opportunity count."
    );
  }

  const exchangeLength =
    exchangeSection.endDistance - exchangeSection.startDistance;
  const triggerDistances = Array.from(
    { length: opportunityCount },
    (_, index) =>
      exchangeSection.startDistance +
      exchangeLength * ((index + 1) / (opportunityCount + 1))
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
    gasExchange: {
      region: exchangeRegion,
      sectionId: exchangeSection.id,
      opportunityCount,
      triggerDistances
    },
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
