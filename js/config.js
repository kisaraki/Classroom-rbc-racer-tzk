function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }

  return value;
}

export const GAME_CONFIG = deepFreeze({
  game: {
    initialLevelId: 1
  },

  renderer: {
    referenceWidth: 1920,
    referenceHeight: 1080,
    minimumWidth: 1280,
    minimumHeight: 720,
    maximumPixelRatio: 2,
    renderResolutionScale: 0.75,
    exposure: 1.08
  },

  camera: {
    fieldOfViewDegrees: 72,
    nearClip: 0.08,
    farClip: 240,
    mouseSensitivity: 0.0022,
    pitchLimitRadians: Math.PI / 3
  },

  palette: {
    oxygenatedRed: "#ff3347",
    rbcBody: "#cf1f2c",
    transitionMagenta: "#d72678",
    deoxygenatedBlue: "#3157c8",
    venousPurple: "#6d348f",
    malariaDark: "#4a173f",
    woundDark: "#3a1118",
    hudGlow: "#f5fbff",
    prototypeBackground: "#100207",
    prototypeFog: "#350912",
    vesselArterial: "#a9162b",
    vesselCapillary: "#9f2150",
    vesselTransition: "#74235f",
    vesselVenous: "#294a89",
    vesselReturn: "#8f1f48",
    vesselEmissive: "#3d0711",
    cockpitTrim: "#ffb2a7",
    cockpitShadow: "#480711",
    headlight: "#ffe4dc",
    hemisphereSky: "#8fb9d8",
    hemisphereGround: "#26020a"
  },

  hp: {
    initial: 100,
    max: 200,
    min: 0
  },

  score: {
    initial: 0
  },

  bp: {
    initial: 100,
    min: 50,
    max: 180,
    safeMin: 80,
    safeMax: 130,
    changeRate: 18
  },

  movement: {
    bpOffset: 50,
    speedPerBp: 0.1,
    minSpeed: 5,
    maxSpeed: 18,
    strafeSpeed: 4.5
  },

  timing: {
    maximumSimulationDeltaSeconds: 0.1,
    realTimeTimersContinueWhilePaused: true,
    millisecondsPerSecond: 1000,
    fpsSampleWindowSeconds: 1
  },

  track: {
    playerCollisionRadius: 0.65,
    wallMargin: 0.35,
    sectionOverlapMin: 0.5,
    sectionOverlapMax: 1.0,
    radii: {
      chamber: 6.5,
      greatVessel: 5.5,
      majorVessel: 5.0,
      arteriole: 4.0,
      systemicCapillary: 3.2,
      pulmonaryCapillary: 3.4,
      venule: 3.8
    }
  },

  vessel: {
    frameSampleCount: 4096,
    frameEpsilon: 0.00000001,
    frameReferenceAxisDotThreshold: 0.95,
    curveType: "centripetal",
    curveTension: 0.5,
    sectionOverlap: 0.75,
    radialSegments: 28,
    tubularSegmentsPerWorldUnit: 0.24,
    minimumTubularSegments: 24,
    fogDensity: 0.011,
    material: {
      roughness: 0.48,
      metalness: 0.03,
      emissiveIntensity: 0.2
    },
    flowTexture: {
      size: 64,
      baseValue: 108,
      stripeValue: 164,
      arrowValue: 228,
      alphaValue: 255,
      stripeFrequency: 7,
      waveFrequency: 3,
      waveAmplitude: 0.13,
      stripeThreshold: 0.76,
      arrowPeriod: 4,
      arrowSlope: 0.42,
      arrowTip: 0.72,
      arrowCenter: 0.5,
      arrowLineWidth: 0.055,
      repeatAlong: 16,
      repeatAround: 2,
      offsetSpeed: 0.055
    },
    lighting: {
      hemisphereIntensity: 1.25,
      headlightIntensity: 135,
      headlightDistance: 72,
      headlightAngleRadians: 0.72,
      headlightPenumbra: 0.62,
      headlightDecay: 1.35,
      targetDistance: 4
    }
  },

  playerModel: {
    profileSamples: 20,
    radialSegments: 48,
    outerRadius: 1.2,
    centerHalfThickness: 0.16,
    rimRise: 0.34,
    profilePower: 1.35,
    bodyRotationXRadians: Math.PI / 2,
    bodyRoughness: 0.34,
    bodyMetalness: 0.08,
    bodyVisibleInFirstPerson: false,
    label: {
      glyphWidth: 5,
      glyphHeight: 7,
      glyphSpacing: 2,
      padding: 3,
      pixelScale: 8,
      foregroundRgba: [255, 242, 232, 255],
      backgroundRgba: [0, 0, 0, 0],
      planeWidth: 1.08,
      planeHeight: 0.36,
      bodyPosition: [0, 0, -0.38],
      cockpitPosition: [0, -0.96, -1.66],
      renderOrder: 12
    },
    cockpit: {
      sphereRadius: 1,
      widthSegments: 48,
      heightSegments: 24,
      nosePosition: [0, -1.38, -2.5],
      noseScale: [2.25, 0.62, 1.08],
      noseRoughness: 0.3,
      noseMetalness: 0.12,
      trimRadius: 0.68,
      trimTubeRadius: 0.045,
      trimRadialSegments: 12,
      trimTubularSegments: 48,
      trimPosition: [0, -1.14, -1.78],
      renderOrder: 10
    },
    hood: {
      pivotPosition: [0, -1.08, -2.24],
      meshPosition: [0, 0, -0.18],
      meshScale: [1.28, 0.24, 0.78],
      hingeOffset: [0, -0.04, 0.64],
      closedAngleRadians: 0,
      renderOrder: 11
    }
  },

  hud: {
    valuePrecision: 0,
    distancePrecision: 1,
    minimapProgressPrecision: 4,
    timerPrecision: 1,
    fpsPrecision: 0
  },

  collision: {
    window: 0.75
  },

  entities: {
    spawnIntervalMin: 8,
    spawnIntervalMax: 16,
    spawnAheadMin: 35,
    spawnAheadMax: 70,
    despawnBehind: 20,
    maximumActive: 24,
    minimumGap: 2.5,
    maximumConsecutiveSameDebuff: 2
  },

  entityTypes: {
    vitaminC: {
      baseWeight: 18,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.5
    },
    vitaminB12: {
      baseWeight: 14,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.5
    },
    iron: {
      baseWeight: 14,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.5
    },
    carbonMonoxide: {
      baseWeight: 20,
      scoreDelta: -2,
      hpDelta: -2,
      collisionRadius: 0.55
    },
    malaria: {
      baseWeight: 10,
      scoreDelta: -3,
      hpDelta: -3,
      collisionRadius: 0.7
    },
    alcohol: {
      baseWeight: 16,
      scoreDelta: -1,
      hpDelta: -1,
      collisionRadius: 0.55
    },
    wound: {
      scoreDelta: -200,
      collisionRadius: 1.15
    },
    empty: {
      baseWeight: 8
    }
  },

  levels: {
    1: {
      highRisk: false,
      targetDriveSeconds: 300,
      trackLength: 3000,
      startDistance: 0,
      endDistance: 3000,
      seed: 0x52424301,
      controlPoints: [
        [0, 0, 0],
        [0, -4, -90],
        [18, -22, -248],
        [-14, -55, -442],
        [24, -105, -684],
        [-22, -180, -915],
        [16, -275, -1140],
        [-10, -385, -1328],
        [8, -500, -1480],
        [55, -565, -1540],
        [135, -600, -1545],
        [218, -570, -1490],
        [268, -505, -1395],
        [285, -425, -1270],
        [274, -350, -1140],
        [290, -245, -940],
        [275, -130, -745],
        [292, -70, -680],
        [305, -30, -635]
      ],
      gasTriggerRatios: {
        primary: 0.59,
        retry: 0.66,
        fallback: 0.695
      },
      sectionRatios: [
        0.03,
        0.12,
        0.25,
        0.15,
        0.15,
        0.10,
        0.15,
        0.05
      ],
      routeSections: [
        {
          startDistance: 0,
          endDistance: 90,
          radius: 6.5,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0,
          minimapEndProgress: 0.03
        },
        {
          startDistance: 90,
          endDistance: 450,
          radius: 5.5,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "vesselArterial",
          minimapStartProgress: 0.03,
          minimapEndProgress: 0.15
        },
        {
          startDistance: 450,
          endDistance: 1200,
          radius: 5.0,
          colorStartKey: "vesselArterial",
          colorEndKey: "transitionMagenta",
          minimapStartProgress: 0.15,
          minimapEndProgress: 0.40
        },
        {
          startDistance: 1200,
          endDistance: 1650,
          radius: 4.0,
          colorStartKey: "transitionMagenta",
          colorEndKey: "vesselCapillary",
          minimapStartProgress: 0.40,
          minimapEndProgress: 0.55
        },
        {
          startDistance: 1650,
          endDistance: 2100,
          radius: 3.2,
          colorStartKey: "vesselCapillary",
          colorEndKey: "deoxygenatedBlue",
          minimapStartProgress: 0.55,
          minimapEndProgress: 0.70
        },
        {
          startDistance: 2100,
          endDistance: 2400,
          radius: 3.8,
          colorStartKey: "deoxygenatedBlue",
          colorEndKey: "vesselVenous",
          minimapStartProgress: 0.70,
          minimapEndProgress: 0.80
        },
        {
          startDistance: 2400,
          endDistance: 2850,
          radius: 5.5,
          colorStartKey: "vesselVenous",
          colorEndKey: "venousPurple",
          minimapStartProgress: 0.80,
          minimapEndProgress: 0.95
        },
        {
          startDistance: 2850,
          endDistance: 3000,
          radius: 6.5,
          colorStartKey: "venousPurple",
          colorEndKey: "venousPurple",
          minimapStartProgress: 0.95,
          minimapEndProgress: 1
        }
      ],
      multipliers: {
        buff: 1,
        debuff: 1,
        alcohol: 1,
        wound: 1
      }
    },
    2: {
      highRisk: false,
      targetDriveSeconds: 90,
      trackLength: 900,
      seed: 0x52424302,
      controlPoints: [],
      gasTriggerRatios: {
        primary: 0.40,
        retry: 0.55,
        fallback: 0.64
      },
      sectionRatios: [
        0.05,
        0.25,
        0.35,
        0.25,
        0.10
      ],
      multipliers: {
        buff: 1,
        debuff: 1,
        alcohol: 1,
        wound: 1
      }
    },
    3: {
      highRisk: false,
      targetDriveSeconds: 180,
      trackLength: 1800,
      seed: 0x52424303,
      controlPoints: [],
      gasTriggerRatios: {
        primary: 0.56,
        retry: 0.65,
        fallback: 0.695
      },
      sectionRatios: [
        0.03,
        0.12,
        0.20,
        0.15,
        0.20,
        0.10,
        0.15,
        0.05
      ],
      multipliers: {
        buff: 1,
        debuff: 1,
        alcohol: 1,
        wound: 1
      }
    },
    4: {
      highRisk: true,
      targetDriveSeconds: 90,
      trackLength: 900,
      seed: 0x52424304,
      controlPoints: [],
      gasTriggerRatios: {
        primary: 0.40,
        retry: 0.55,
        fallback: 0.64
      },
      sectionRatios: [
        0.05,
        0.25,
        0.35,
        0.25,
        0.10
      ],
      multipliers: {
        buff: 0.7,
        debuff: 2.5,
        alcohol: 2,
        wound: 3
      }
    }
  },

  qte: {
    durationMs: 1500,
    resultDisplayMs: 800,
    oxygenThreshold: 3,
    carbonDioxideThreshold: 3,
    successScore: 10,
    failureScore: -3,
    maxAttempts: 2
  },

  lowBloodPressure: {
    durationSeconds: 5,
    cooldownSeconds: 10,
    maximumChancePerSecond: 0.35,
    chancePerBpPoint: 0.025
  },

  intoxication: {
    triggerCount: 5,
    durationSeconds: 15,
    inputDelayMinMs: 250,
    inputDelayMaxMs: 700,
    inputFailureChance: 0.35,
    bpRandomIntervalMs: 400,
    swayFrequency: 3.2,
    swayAmplitude: 0.75
  },

  malaria: {
    obstructionDurationSeconds: 5,
    hoodOpenAngle: 1.15,
    hoodPrimaryFrequency: 9.5,
    hoodPrimaryAmplitude: 0.22,
    hoodSecondaryFrequency: 17,
    hoodSecondaryAmplitude: 0.08,
    hoodRollFrequency: 6.5,
    hoodRollAmplitude: 0.12,
    hoodOffsetFrequency: 11,
    hoodOffsetAmplitude: 0.025,
    maximumScreenCoverage: 0.65,
    combinedMaximumCoverage: 0.55,
    restoreDurationSeconds: 0.4
  },

  wound: {
    baseChanceCoefficient: 0.005,
    exponentialBpScale: 15,
    maximumChancePerSecond: 0.45,
    highRiskFormulaMinBp: 80,
    safeRangeMultiplier: 1,
    maximumActive: 2,
    minimumGap: 45,
    dodgedBehindDistance: 10
  },

  checkpoint: {
    retryMinimumHp: 50
  },

  cutscenes: {
    transferDurationMinSeconds: 3,
    transferDurationMaxSeconds: 5
  }
});
