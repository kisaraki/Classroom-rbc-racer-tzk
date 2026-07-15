function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }

  return value;
}

export const GAME_CONFIG = deepFreeze({
  app: {
    name: "Project Aorta：大動脈計畫室",
    subtitle: "RBC RACER",
    status: "STABLE",
    version: "1.1",
    releaseDate: "20260715",
    displayVersion: "Version：1.1（20260715）"
  },

  game: {
    initialLevelId: 1,
    totalLevelCount: 4
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
    rbcDeoxygenatedBody: "#95294f",
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
    vitaminC: "#ffd34e",
    vitaminB12: "#45e0d0",
    iron: "#bfcbd5",
    carbonMonoxide: "#20242d",
    alcohol: "#e6b85c",
    entityOxygen: "#ff5263",
    entityHydrogen: "#f5fbff",
    entityBond: "#7d8792",
    entityLabelPanel: "#14070a",
    entityLabelInk: "#f5fbff",
    entityWoundRim: "#b2152c",
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

  penalties: {
    debuffMultiplier: 2
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

  performanceAcceptance: {
    minimumFps: 30,
    maximumDrawCalls: 30,
    maximumTriangles: 20000,
    longRunSampleSeconds: 60,
    maximumHeapGrowthMegabytes: 16
  },

  deviceSupport: {
    mobileUserAgentPattern:
      "Mobi|Android|iPhone|iPad|iPod|IEMobile|Windows Phone|Opera Mini",
    touchTabletPlatform: "MacIntel",
    touchTabletMinimumPoints: 2,
    mobileReason: "MOBILE_DEVICE",
    supportedDatasetValue: "SUPPORTED",
    blockedState: "UNSUPPORTED",
    blockedDatasetValue: "MOBILE_BLOCKED",
    overlayMode: "UNSUPPORTED",
    overlayIndex: "!",
    overlayKicker: "Device check / Desktop required",
    overlayTitle: "不支援手機",
    overlayCopy:
      "本遊戲需要鍵盤、滑鼠與 Pointer Lock，手機或平板無法提供完整操作，因此已停止啟動。請改用桌上型或筆記型電腦。",
    overlayNote: "未建立 Three.js 場景，也未啟動遊戲計時器。"
  },

  pointerLock: {
    requestTimeoutMs: 1500
  },

  track: {
    playerCollisionRadius: 0.55,
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
    outerRadius: 1.02,
    centerHalfThickness: 0.14,
    rimRise: 0.29,
    profilePower: 1.35,
    bodyRotationXRadians: Math.PI / 2,
    bodyRoughness: 0.34,
    bodyMetalness: 0.08,
    bodyVisibleInFirstPerson: false,
    environmentReflection: {
      bodyColorMix: 0.1,
      cockpitColorMix: 0.13,
      bodyEmissiveIntensity: 0.1,
      cockpitEmissiveMix: 0.28,
      cockpitEmissiveIntensity: 0.62,
      responsePerSecond: 3.6
    },
    label: {
      glyphWidth: 5,
      glyphHeight: 7,
      glyphSpacing: 2,
      padding: 3,
      pixelScale: 8,
      foregroundRgba: [255, 242, 232, 255],
      backgroundRgba: [0, 0, 0, 0],
      planeWidth: 0.62,
      planeHeight: 0.32,
      bodyPosition: [0, 0, -0.38],
      cockpitPosition: [0, -0.82, -1.8],
      renderOrder: 12
    },
    cockpit: {
      sphereRadius: 1,
      widthSegments: 48,
      heightSegments: 24,
      nosePosition: [0, -1.38, -2.5],
      noseScale: [1.92, 0.53, 0.92],
      noseRoughness: 0.3,
      noseMetalness: 0.12,
      trimRadius: 0.58,
      trimTubeRadius: 0.038,
      trimRadialSegments: 12,
      trimTubularSegments: 48,
      trimPosition: [0, -1.14, -1.78],
      renderOrder: 10
    },
    hood: {
      pivotPosition: [0, -1.08, -2.24],
      meshPosition: [0, 0, -0.18],
      meshScale: [1.42, 0.24, 0.92],
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
    fpsPrecision: 0,
    probabilityPrecision: 6,
    statusTimePrecision: 1,
    messageTimePrecision: 1,
    messageDefaultDurationSeconds: 2.8
  },

  flightInstruments: {
    bodyReticleTravelXPercent: 8,
    bodyReticleTravelYPercent: 7,
    viewReticleTravelXPercent: 11,
    viewReticleTravelYPercent: 9,
    viewYawDisplayRangeRadians: Math.PI / 2,
    attitudePanelTravelPercent: 40,
    fullCircleDegrees: 360,
    halfCircleDegrees: 180,
    angleDegreesPerRadian: 180 / Math.PI,
    altitudePrecision: 1,
    coordinatePrecision: 2,
    anglePrecision: 0
  },

  minimap: {
    viewBoxWidth: 360,
    viewBoxHeight: 300,
    exchangeAnchorNodeByRegion: {
      TISSUE: "tissues",
      LUNG: "lungs"
    },
    vesselStrokeWidth: 4,
    activeVesselStrokeWidth: 6,
    routeStrokeWidth: 1,
    nodeStrokeWidth: 2,
    nodeFillOpacity: 0.18,
    nodeLabelFontSize: 10,
    heartOutline: {
      id: "four-chamber-heart",
      label: "心臟輪廓，包含右心房、右心室、左心房與左心室",
      chamberNodeIds: [
        "right-atrium",
        "right-ventricle",
        "left-atrium",
        "left-ventricle"
      ],
      fillColorKey: "woundDark",
      strokeColorKey: "cockpitTrim",
      fillOpacity: 0.62,
      strokeOpacity: 0.82,
      strokeWidth: 2.5,
      start: [181, 232],
      segments: [
        {
          control1: [166, 229],
          control2: [146, 220],
          end: [143, 201]
        },
        {
          control1: [140, 183],
          control2: [146, 162],
          end: [158, 155]
        },
        {
          control1: [168, 149],
          control2: [177, 155],
          end: [181, 163]
        },
        {
          control1: [186, 155],
          control2: [195, 149],
          end: [205, 155]
        },
        {
          control1: [217, 163],
          control2: [221, 182],
          end: [217, 200]
        },
        {
          control1: [213, 218],
          control2: [195, 228],
          end: [181, 232]
        }
      ]
    },
    nodes: [
      {
        id: "brain",
        label: "腦",
        shape: "capsule",
        x: 180,
        y: 34,
        width: 56,
        height: 24,
        cornerRadius: 12,
        labelX: 180,
        labelY: 37,
        labelAnchor: "middle",
        colorKey: "hudGlow"
      },
      {
        id: "lungs",
        label: "肺",
        shape: "capsule",
        x: 180,
        y: 102,
        width: 56,
        height: 28,
        cornerRadius: 14,
        labelX: 180,
        labelY: 105,
        labelAnchor: "middle",
        colorKey: "transitionMagenta"
      },
      {
        id: "right-atrium",
        label: "右心房",
        shape: "circle",
        x: 159,
        y: 176,
        radius: 12,
        labelX: 142,
        labelY: 169,
        labelAnchor: "end",
        colorKey: "deoxygenatedBlue"
      },
      {
        id: "right-ventricle",
        label: "右心室",
        shape: "circle",
        x: 169,
        y: 207,
        radius: 14,
        labelX: 147,
        labelY: 220,
        labelAnchor: "end",
        colorKey: "venousPurple"
      },
      {
        id: "left-atrium",
        label: "左心房",
        shape: "circle",
        x: 201,
        y: 176,
        radius: 11,
        labelX: 218,
        labelY: 169,
        labelAnchor: "start",
        colorKey: "oxygenatedRed"
      },
      {
        id: "left-ventricle",
        label: "左心室",
        shape: "circle",
        x: 195,
        y: 207,
        radius: 14,
        labelX: 219,
        labelY: 220,
        labelAnchor: "start",
        colorKey: "oxygenatedRed"
      },
      {
        id: "tissues",
        label: "組織",
        shape: "capsule",
        x: 180,
        y: 270,
        width: 62,
        height: 24,
        cornerRadius: 12,
        labelX: 180,
        labelY: 273,
        labelAnchor: "middle",
        colorKey: "vesselCapillary"
      }
    ],
    vessels: [
      {
        id: "left-ventricle-to-brain",
        from: "left-ventricle",
        to: "brain",
        colorKey: "oxygenatedRed",
        start: [195, 207],
        control1: [294, 187],
        control2: [300, 72],
        end: [180, 34]
      },
      {
        id: "brain-to-right-atrium",
        from: "brain",
        to: "right-atrium",
        colorKey: "deoxygenatedBlue",
        start: [180, 34],
        control1: [55, 75],
        control2: [72, 153],
        end: [159, 176]
      },
      {
        id: "left-ventricle-to-tissues",
        from: "left-ventricle",
        to: "tissues",
        colorKey: "oxygenatedRed",
        start: [195, 207],
        control1: [270, 226],
        control2: [250, 270],
        end: [180, 270]
      },
      {
        id: "tissues-to-right-atrium",
        from: "tissues",
        to: "right-atrium",
        colorKey: "deoxygenatedBlue",
        start: [180, 270],
        control1: [106, 270],
        control2: [94, 215],
        end: [159, 176]
      },
      {
        id: "right-atrium-to-right-ventricle",
        from: "right-atrium",
        to: "right-ventricle",
        colorKey: "venousPurple",
        start: [159, 176],
        control1: [151, 188],
        control2: [157, 202],
        end: [169, 207]
      },
      {
        id: "right-ventricle-to-lungs",
        from: "right-ventricle",
        to: "lungs",
        colorKey: "deoxygenatedBlue",
        start: [169, 207],
        control1: [111, 183],
        control2: [111, 122],
        end: [180, 102]
      },
      {
        id: "lungs-to-left-atrium",
        from: "lungs",
        to: "left-atrium",
        colorKey: "oxygenatedRed",
        start: [180, 102],
        control1: [247, 115],
        control2: [257, 153],
        end: [201, 176]
      },
      {
        id: "left-atrium-to-left-ventricle",
        from: "left-atrium",
        to: "left-ventricle",
        colorKey: "oxygenatedRed",
        start: [201, 176],
        control1: [211, 188],
        control2: [207, 202],
        end: [195, 207]
      }
    ],
    routes: [
      {
        id: "systemic-lower-circulation-path",
        label: "體循環（腹部及下肢）",
        vesselIds: [
          "left-ventricle-to-tissues",
          "tissues-to-right-atrium",
          "right-atrium-to-right-ventricle"
        ]
      },
      {
        id: "pulmonary-circulation-path",
        label: "肺循環",
        vesselIds: [
          "right-ventricle-to-lungs",
          "lungs-to-left-atrium",
          "left-atrium-to-left-ventricle"
        ]
      },
      {
        id: "systemic-upper-circulation-path",
        label: "體循環（頭部、胸部及上肢）",
        vesselIds: [
          "left-ventricle-to-brain",
          "brain-to-right-atrium",
          "right-atrium-to-right-ventricle"
        ]
      },
      {
        id: "high-risk-pulmonary-circulation-path",
        label: "肺循環（高危險關卡）",
        vesselIds: [
          "right-ventricle-to-lungs",
          "lungs-to-left-atrium",
          "left-atrium-to-left-ventricle"
        ]
      }
    ],
    playerMarker: {
      coreRadius: 4,
      haloRadius: 10,
      coordinatePrecision: 3,
      pulseDurationSeconds: 1.4
    }
  },

  collision: {
    window: 0.75,
    playerProfile: {
      topOffsetY: 0,
      bottomOffsetY: -1.91
    },
    entityLabelCategories: ["BUFF", "DEBUFF"],
    categoryPriority: {
      FATAL: 0,
      DEBUFF: 1,
      BUFF: 2
    }
  },

  entities: {
    spawnIntervalMin: 8,
    spawnIntervalMax: 16,
    spawnAheadMin: 35,
    spawnAheadMax: 70,
    despawnBehind: 20,
    maximumActive: 24,
    minimumGap: 2.5,
    maximumConsecutiveSameDebuff: 2,
    reservedDistancePadding: 3,
    fullRotationRadians: Math.PI * 2
  },

  entityTypes: {
    vitaminC: {
      baseWeight: 18,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.77
    },
    vitaminB12: {
      baseWeight: 14,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.81
    },
    iron: {
      baseWeight: 14,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.8
    },
    carbonMonoxide: {
      baseWeight: 20,
      scoreDelta: -2,
      hpDelta: -2,
      collisionRadius: 0.75
    },
    malaria: {
      baseWeight: 10,
      scoreDelta: -3,
      hpDelta: -3,
      collisionRadius: 1.19
    },
    alcohol: {
      baseWeight: 16,
      scoreDelta: -1,
      hpDelta: -1,
      collisionRadius: 1.08
    },
    wound: {
      scoreDelta: -200,
      collisionRadius: 1.15
    },
    empty: {
      baseWeight: 8
    }
  },

  entityVisuals: {
    label: {
      canvasWidth: 256,
      canvasHeight: 112,
      borderWidth: 6,
      fontSize: 46,
      fontWeight: 800,
      fontFamily: "sans-serif",
      horizontalTextRatio: 0.5,
      verticalTextRatio: 0.54,
      spriteWidth: 2.7,
      spriteHeight: 1.18,
      offsetY: 1.35,
      renderOrder: 8,
      backgroundColorKey: "entityLabelPanel",
      textColorKey: "entityLabelInk"
    },
    gasToken: {
      id: "gas-token",
      label: "O₂ / CO₂",
      modelKey: "gasToken"
    },
    models: {
      vitaminC: {
        accentColorKey: "vitaminC",
        worldScale: 0.82,
        spinRadiansPerSecond: 1.35,
        pulseFrequencyRadiansPerSecond: 2.4,
        pulseAmplitude: 0.06,
        parts: [
          {
            geometry: "octahedron",
            args: [0.7, 0],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "vitaminC",
            emissiveColorKey: "vitaminC",
            roughness: 0.32,
            metalness: 0.12,
            emissiveIntensity: 0.2
          },
          {
            geometry: "torus",
            args: [0.82, 0.055, 8, 28],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "hudGlow",
            emissiveColorKey: "vitaminC",
            roughness: 0.24,
            metalness: 0.18,
            emissiveIntensity: 0.32
          }
        ]
      },
      vitaminB12: {
        accentColorKey: "vitaminB12",
        worldScale: 0.84,
        spinRadiansPerSecond: -1.1,
        pulseFrequencyRadiansPerSecond: 2.1,
        pulseAmplitude: 0.055,
        parts: [
          {
            geometry: "dodecahedron",
            args: [0.68, 0],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "vitaminB12",
            emissiveColorKey: "vitaminB12",
            roughness: 0.38,
            metalness: 0.1,
            emissiveIntensity: 0.2
          },
          {
            geometry: "torus",
            args: [0.84, 0.065, 8, 28],
            position: [0, 0, 0],
            rotation: [Math.PI / 2, 0, 0],
            scale: [1, 1, 1],
            colorKey: "hudGlow",
            emissiveColorKey: "vitaminB12",
            roughness: 0.28,
            metalness: 0.16,
            emissiveIntensity: 0.3
          }
        ]
      },
      iron: {
        accentColorKey: "iron",
        worldScale: 0.86,
        spinRadiansPerSecond: 0.9,
        pulseFrequencyRadiansPerSecond: 1.7,
        pulseAmplitude: 0.045,
        parts: [
          {
            geometry: "sphere",
            args: [0.62, 20, 14],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 0.78],
            colorKey: "iron",
            emissiveColorKey: "entityBond",
            roughness: 0.24,
            metalness: 0.78,
            emissiveIntensity: 0.08
          },
          {
            geometry: "torus",
            args: [0.8, 0.085, 8, 24],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "hudGlow",
            emissiveColorKey: "iron",
            roughness: 0.2,
            metalness: 0.72,
            emissiveIntensity: 0.18
          }
        ]
      },
      carbonMonoxide: {
        accentColorKey: "entityOxygen",
        worldScale: 0.92,
        spinRadiansPerSecond: 1.25,
        pulseFrequencyRadiansPerSecond: 2.8,
        pulseAmplitude: 0.035,
        parts: [
          {
            geometry: "sphere",
            args: [0.4, 18, 12],
            position: [-0.38, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "carbonMonoxide",
            emissiveColorKey: "malariaDark",
            roughness: 0.48,
            metalness: 0.12,
            emissiveIntensity: 0.12
          },
          {
            geometry: "sphere",
            args: [0.4, 18, 12],
            position: [0.38, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "entityOxygen",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.42,
            metalness: 0.08,
            emissiveIntensity: 0.2
          },
          {
            geometry: "cylinder",
            args: [0.11, 0.11, 0.56, 12],
            position: [0, 0, 0],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 1],
            colorKey: "entityBond",
            emissiveColorKey: "carbonMonoxide",
            roughness: 0.36,
            metalness: 0.28,
            emissiveIntensity: 0.08
          }
        ]
      },
      malaria: {
        accentColorKey: "venousPurple",
        worldScale: 1.05,
        spinRadiansPerSecond: -0.72,
        pulseFrequencyRadiansPerSecond: 4.2,
        pulseAmplitude: 0.11,
        parts: [
          {
            geometry: "irregularIcosahedron",
            args: [0.64, 2],
            distortionAmplitude: 0.16,
            distortionFrequency: 5.3,
            distortionAxisWeights: [1, 1.7, 2.3],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 0.9, 0.82],
            colorKey: "malariaDark",
            emissiveColorKey: "venousPurple",
            roughness: 0.78,
            metalness: 0.02,
            emissiveIntensity: 0.24
          },
          {
            geometry: "torusKnot",
            args: [0.53, 0.075, 40, 8, 2, 3],
            position: [0, 0, 0],
            rotation: [0.28, 0.4, 0],
            scale: [1.25, 1.1, 0.62],
            colorKey: "venousPurple",
            emissiveColorKey: "malariaDark",
            roughness: 0.7,
            metalness: 0.04,
            emissiveIntensity: 0.14
          },
          {
            geometry: "cone",
            args: [0.14, 0.52, 8],
            position: [0, 0.73, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "malariaDark",
            emissiveColorKey: "venousPurple",
            roughness: 0.74,
            metalness: 0.02,
            emissiveIntensity: 0.18
          },
          {
            geometry: "cone",
            args: [0.14, 0.48, 8],
            position: [0.68, -0.12, 0],
            rotation: [0, 0, -Math.PI / 2],
            scale: [1, 1, 1],
            colorKey: "malariaDark",
            emissiveColorKey: "venousPurple",
            roughness: 0.74,
            metalness: 0.02,
            emissiveIntensity: 0.18
          },
          {
            geometry: "cone",
            args: [0.13, 0.44, 8],
            position: [-0.62, -0.15, 0.06],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 1],
            colorKey: "malariaDark",
            emissiveColorKey: "venousPurple",
            roughness: 0.74,
            metalness: 0.02,
            emissiveIntensity: 0.18
          },
          {
            geometry: "cone",
            args: [0.12, 0.42, 8],
            position: [0.08, -0.65, 0.12],
            rotation: [0, 0, Math.PI],
            scale: [1, 1, 1],
            colorKey: "malariaDark",
            emissiveColorKey: "venousPurple",
            roughness: 0.74,
            metalness: 0.02,
            emissiveIntensity: 0.18
          }
        ]
      },
      alcohol: {
        accentColorKey: "alcohol",
        worldScale: 0.9,
        spinRadiansPerSecond: -1.45,
        pulseFrequencyRadiansPerSecond: 2.6,
        pulseAmplitude: 0.04,
        parts: [
          {
            geometry: "sphere",
            args: [0.32, 16, 12],
            position: [-0.52, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "carbonMonoxide",
            emissiveColorKey: "alcohol",
            roughness: 0.5,
            metalness: 0.08,
            emissiveIntensity: 0.08
          },
          {
            geometry: "sphere",
            args: [0.32, 16, 12],
            position: [0.05, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "carbonMonoxide",
            emissiveColorKey: "alcohol",
            roughness: 0.5,
            metalness: 0.08,
            emissiveIntensity: 0.08
          },
          {
            geometry: "sphere",
            args: [0.34, 16, 12],
            position: [0.62, 0.08, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "entityOxygen",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.42,
            metalness: 0.05,
            emissiveIntensity: 0.18
          },
          {
            geometry: "sphere",
            args: [0.2, 14, 10],
            position: [0.86, 0.4, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "entityHydrogen",
            emissiveColorKey: "hudGlow",
            roughness: 0.34,
            metalness: 0.02,
            emissiveIntensity: 0.2
          },
          {
            geometry: "cylinder",
            args: [0.08, 0.08, 0.46, 10],
            position: [-0.235, 0, 0],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 1],
            colorKey: "entityBond",
            emissiveColorKey: "alcohol",
            roughness: 0.38,
            metalness: 0.18,
            emissiveIntensity: 0.06
          },
          {
            geometry: "cylinder",
            args: [0.08, 0.08, 0.44, 10],
            position: [0.335, 0.04, 0],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 1],
            colorKey: "entityBond",
            emissiveColorKey: "alcohol",
            roughness: 0.38,
            metalness: 0.18,
            emissiveIntensity: 0.06
          }
        ]
      },
      gasToken: {
        accentColorKey: "entityOxygen",
        worldScale: 1,
        spinRadiansPerSecond: 0.9,
        pulseFrequencyRadiansPerSecond: 3.2,
        pulseAmplitude: 0.08,
        parts: [
          {
            geometry: "torus",
            args: [1.18, 0.12, 10, 36],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "entityOxygen",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.24,
            metalness: 0.2,
            emissiveIntensity: 0.42
          },
          {
            geometry: "torus",
            args: [0.76, 0.08, 8, 28],
            position: [0, 0, 0.08],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "deoxygenatedBlue",
            emissiveColorKey: "deoxygenatedBlue",
            roughness: 0.28,
            metalness: 0.16,
            emissiveIntensity: 0.38
          },
          {
            geometry: "sphere",
            args: [0.22, 12, 8],
            position: [0.82, 0, 0.12],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "entityOxygen",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.3,
            metalness: 0.08,
            emissiveIntensity: 0.32
          },
          {
            geometry: "sphere",
            args: [0.22, 12, 8],
            position: [-0.82, 0, 0.12],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "entityOxygen",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.3,
            metalness: 0.08,
            emissiveIntensity: 0.32
          },
          {
            geometry: "sphere",
            args: [0.2, 12, 8],
            position: [0, 0.82, -0.12],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "deoxygenatedBlue",
            emissiveColorKey: "deoxygenatedBlue",
            roughness: 0.32,
            metalness: 0.08,
            emissiveIntensity: 0.3
          },
          {
            geometry: "sphere",
            args: [0.2, 12, 8],
            position: [0, -0.82, -0.12],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            colorKey: "deoxygenatedBlue",
            emissiveColorKey: "deoxygenatedBlue",
            roughness: 0.32,
            metalness: 0.08,
            emissiveIntensity: 0.3
          }
        ]
      },
      wound: {
        accentColorKey: "entityWoundRim",
        worldScale: 1,
        spinRadiansPerSecond: 0.28,
        pulseFrequencyRadiansPerSecond: 1.8,
        pulseAmplitude: 0.045,
        parts: [
          {
            geometry: "torus",
            args: [0.95, 0.2, 10, 36],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1.18, 1],
            colorKey: "entityWoundRim",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.82,
            metalness: 0.02,
            emissiveIntensity: 0.18
          },
          {
            geometry: "circle",
            args: [0.82, 32],
            position: [0, 0, 0.06],
            rotation: [0, 0, 0],
            scale: [1, 1.18, 1],
            colorKey: "woundDark",
            emissiveColorKey: "prototypeBackground",
            roughness: 0.96,
            metalness: 0,
            emissiveIntensity: 0.08
          },
          {
            geometry: "cone",
            args: [0.18, 0.54, 8],
            position: [0, 1.12, 0],
            rotation: [0, 0, Math.PI],
            scale: [1, 1, 1],
            colorKey: "entityWoundRim",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.8,
            metalness: 0.02,
            emissiveIntensity: 0.16
          },
          {
            geometry: "cone",
            args: [0.16, 0.48, 8],
            position: [0.98, -0.42, 0],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 1],
            colorKey: "entityWoundRim",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.8,
            metalness: 0.02,
            emissiveIntensity: 0.16
          },
          {
            geometry: "cone",
            args: [0.17, 0.5, 8],
            position: [-0.95, -0.38, 0],
            rotation: [0, 0, -Math.PI / 2],
            scale: [1, 1, 1],
            colorKey: "entityWoundRim",
            emissiveColorKey: "oxygenatedRed",
            roughness: 0.8,
            metalness: 0.02,
            emissiveIntensity: 0.16
          }
        ]
      }
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
      startDistance: 0,
      endDistance: 900,
      seed: 0x52424302,
      controlPoints: [
        [0, 0, 0],
        [0, -3.8, -42.4],
        [-18.8, -7.5, -122.4],
        [-39.6, -3.8, -207.2],
        [-51.8, 18.8, -282.6],
        [-42.4, 51.8, -367.3],
        [-11.3, 75.4, -442.7],
        [28.3, 69.7, -522.7],
        [58.4, 42.4, -602.8],
        [61.2, 9.4, -687.6],
        [35.8, -11.3, -772.3],
        [0, 0, -828.9]
      ],
      sectionRatios: [
        0.05,
        0.25,
        0.35,
        0.25,
        0.10
      ],
      routeSections: [
        {
          startDistance: 0,
          endDistance: 45,
          radius: 6.5,
          colorStartKey: "deoxygenatedBlue",
          colorEndKey: "deoxygenatedBlue",
          minimapStartProgress: 0,
          minimapEndProgress: 0.05
        },
        {
          startDistance: 45,
          endDistance: 270,
          radius: 5.0,
          colorStartKey: "deoxygenatedBlue",
          colorEndKey: "vesselVenous",
          minimapStartProgress: 0.05,
          minimapEndProgress: 0.30
        },
        {
          startDistance: 270,
          endDistance: 585,
          radius: 3.4,
          colorStartKey: "vesselVenous",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0.30,
          minimapEndProgress: 0.65
        },
        {
          startDistance: 585,
          endDistance: 810,
          radius: 5.0,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0.65,
          minimapEndProgress: 0.90
        },
        {
          startDistance: 810,
          endDistance: 900,
          radius: 6.5,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0.90,
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
    3: {
      highRisk: false,
      targetDriveSeconds: 180,
      trackLength: 1800,
      startDistance: 0,
      endDistance: 1800,
      seed: 0x52424303,
      controlPoints: [
        [0, 0, 0],
        [0, 3.8, -51.2],
        [17.1, 26.5, -161.1],
        [36, 68.2, -293.7],
        [26.5, 123.2, -445.3],
        [-9.5, 175.3, -597],
        [-52.1, 208.5, -748.6],
        [-83.4, 197.1, -890.7],
        [-94.8, 142.1, -1032.8],
        [-77.7, 75.8, -1175],
        [-45.5, 19, -1317.1],
        [-11.4, -19, -1440.3],
        [22.7, -30.3, -1549.2],
        [45.5, -17.1, -1639.3],
        [49.3, 0, -1686.6]
      ],
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
      routeSections: [
        {
          startDistance: 0,
          endDistance: 54,
          radius: 6.5,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0,
          minimapEndProgress: 0.03
        },
        {
          startDistance: 54,
          endDistance: 270,
          radius: 5.5,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "vesselArterial",
          minimapStartProgress: 0.03,
          minimapEndProgress: 0.15
        },
        {
          startDistance: 270,
          endDistance: 630,
          radius: 5.0,
          colorStartKey: "vesselArterial",
          colorEndKey: "transitionMagenta",
          minimapStartProgress: 0.15,
          minimapEndProgress: 0.35
        },
        {
          startDistance: 630,
          endDistance: 900,
          radius: 4.0,
          colorStartKey: "transitionMagenta",
          colorEndKey: "vesselCapillary",
          minimapStartProgress: 0.35,
          minimapEndProgress: 0.50
        },
        {
          startDistance: 900,
          endDistance: 1260,
          radius: 3.2,
          colorStartKey: "vesselCapillary",
          colorEndKey: "deoxygenatedBlue",
          minimapStartProgress: 0.50,
          minimapEndProgress: 0.70
        },
        {
          startDistance: 1260,
          endDistance: 1440,
          radius: 3.8,
          colorStartKey: "deoxygenatedBlue",
          colorEndKey: "vesselVenous",
          minimapStartProgress: 0.70,
          minimapEndProgress: 0.80
        },
        {
          startDistance: 1440,
          endDistance: 1710,
          radius: 5.5,
          colorStartKey: "vesselVenous",
          colorEndKey: "venousPurple",
          minimapStartProgress: 0.80,
          minimapEndProgress: 0.95
        },
        {
          startDistance: 1710,
          endDistance: 1800,
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
    4: {
      highRisk: true,
      targetDriveSeconds: 90,
      trackLength: 900,
      startDistance: 0,
      endDistance: 900,
      seed: 0x52424304,
      controlPoints: [
        [0, 0, 0],
        [0, -3.8, -42.4],
        [-18.8, -7.5, -122.4],
        [-39.6, -3.8, -207.2],
        [-51.8, 18.8, -282.6],
        [-42.4, 51.8, -367.3],
        [-11.3, 75.4, -442.7],
        [28.3, 69.7, -522.7],
        [58.4, 42.4, -602.8],
        [61.2, 9.4, -687.6],
        [35.8, -11.3, -772.3],
        [0, 0, -828.9]
      ],
      sectionRatios: [
        0.05,
        0.25,
        0.35,
        0.25,
        0.10
      ],
      routeSections: [
        {
          startDistance: 0,
          endDistance: 45,
          radius: 6.5,
          colorStartKey: "deoxygenatedBlue",
          colorEndKey: "deoxygenatedBlue",
          minimapStartProgress: 0,
          minimapEndProgress: 0.05
        },
        {
          startDistance: 45,
          endDistance: 270,
          radius: 5.0,
          colorStartKey: "deoxygenatedBlue",
          colorEndKey: "vesselVenous",
          minimapStartProgress: 0.05,
          minimapEndProgress: 0.30
        },
        {
          startDistance: 270,
          endDistance: 585,
          radius: 3.4,
          colorStartKey: "vesselVenous",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0.30,
          minimapEndProgress: 0.65
        },
        {
          startDistance: 585,
          endDistance: 810,
          radius: 5.0,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0.65,
          minimapEndProgress: 0.90
        },
        {
          startDistance: 810,
          endDistance: 900,
          radius: 6.5,
          colorStartKey: "oxygenatedRed",
          colorEndKey: "oxygenatedRed",
          minimapStartProgress: 0.90,
          minimapEndProgress: 1
        }
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
    carbonMonoxidePoisoningThreshold: 9,
    successScore: 10,
    failureScore: -6,
    opportunityCountByRegion: {
      TISSUE: 10,
      LUNG: 20
    }
  },

  lowBloodPressure: {
    durationSeconds: 5,
    cooldownSeconds: 10,
    maximumChancePerSecond: 0.35,
    chancePerBpPoint: 0.025
  },

  bloodPressureHazards: {
    checkIntervalSeconds: 1,
    randomSeedSalt: 0x42504835
  },

  intoxication: {
    triggerCount: 5,
    durationSeconds: 15,
    inputDelayMinMs: 250,
    inputDelayMaxMs: 700,
    inputFailureChance: 0.35,
    bpRandomIntervalMs: 400,
    swayFrequency: 3.2,
    swayAmplitude: 0.75,
    randomSeedSalt: 0x53544637
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
    minimumScreenCoverage: 0.52,
    maximumScreenCoverage: 0.82,
    combinedMaximumCoverage: 0.72,
    restoreDurationSeconds: 0.4,
    steamBlurPixels: 8,
    steamOpacity: 0.72,
    steamDriftSeconds: 6
  },

  bloodRupture: {
    malariaCollisionInterval: 5,
    hoodDurationMultiplier: 3,
    bloodPressureMaximum: 60
  },

  carbonMonoxidePoisoning: {
    collisionTriggerCount: 10
  },

  wound: {
    baseChanceCoefficient: 0.005,
    exponentialBpScale: 15,
    maximumChancePerSecond: 0.45,
    highRiskFormulaMinBp: 80,
    safeRangeMultiplier: 1,
    maximumActive: 2,
    minimumGap: 45,
    dodgedBehindDistance: 10,
    placementAttempts: 16
  },

  checkpoint: {
    retryMinimumHp: 50
  },

  cutscenes: {
    transferDurationMinSeconds: 3,
    transferDurationMaxSeconds: 5,
    durationsSeconds: {
      TRANSFER: 4,
      RECYCLE: 5.2,
      FALL: 4.8,
      STROKE: 3.8,
      TIMEOUT: 5.6,
      VICTORY: 7.5
    },
    timelines: {
      TRANSFER: [
        { id: "CHAMBER_ENTRY", endProgress: 0.2 },
        { id: "CONVEYOR", endProgress: 0.78 },
        { id: "CHAMBER_ARRIVAL", endProgress: 1 }
      ],
      RECYCLE: [
        { id: "FACTORY_APPROACH", endProgress: 0.25 },
        { id: "DISASSEMBLY", endProgress: 0.78 },
        { id: "RECYCLED", endProgress: 1 }
      ],
      FALL: [
        { id: "VESSEL_EXIT", endProgress: 0.24 },
        { id: "TUMBLE", endProgress: 0.72 },
        { id: "ABYSS", endProgress: 1 }
      ],
      STROKE: [
        { id: "IMPACT", endProgress: 0.22 },
        { id: "BLACKOUT", endProgress: 0.62 },
        { id: "DIAGNOSIS", endProgress: 1 }
      ],
      TIMEOUT: [
        { id: "DEHYDRATION", endProgress: 0.24 },
        { id: "LIVER_CONVEYOR", endProgress: 0.78 },
        { id: "HEPATIC_RECYCLE", endProgress: 1 }
      ],
      VICTORY: [
        { id: "ARTERIAL_ENTRY", endProgress: 0.2 },
        { id: "OXYGEN_PARADE", endProgress: 0.78 },
        { id: "FINAL_STATISTICS", endProgress: 1 }
      ]
    },
    recycleFragmentCount: 12,
    recycleFragmentColumns: 4,
    victoryParadeRbcCount: 6,
    victoryParadeRows: 2,
    victoryConfettiCount: 36,
    victoryConfettiRows: 6,
    victoryConfettiColumns: 12
  }
});
