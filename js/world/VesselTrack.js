import {
  CatmullRomCurve3,
  Color,
  DataTexture,
  Group,
  LinearFilter,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  UnsignedByteType,
  Vector3
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import {
  GAS_EXCHANGE_STATUS,
  isLevelData
} from "../data/schemas.js?v=stable-v1.1-20260715-r2";
import { distanceToNormalizedProgress } from "./TrackMath.js";
import { TrackSection } from "./TrackSection.js?v=stable-v1.1-20260715-r2";

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

function createFlowTexture(textureConfig) {
  const size = textureConfig.size;
  const data = new Uint8Array(size * size * 4);
  const denominator = size - 1;
  let dataIndex = 0;

  for (let y = 0; y < size; y += 1) {
    const around = y / denominator;

    for (let x = 0; x < size; x += 1) {
      const along = x / denominator;
      const wave =
        Math.sin(
          around * textureConfig.waveFrequency * Math.PI * 2
        ) * textureConfig.waveAmplitude;
      const stripe = Math.sin(
        (along * textureConfig.stripeFrequency + wave) *
          Math.PI *
          2
      );
      const arrowCycle =
        (along * textureConfig.arrowPeriod) % 1;
      const arrowCenter =
        textureConfig.arrowTip -
        Math.abs(around - textureConfig.arrowCenter) *
          textureConfig.arrowSlope;
      const isArrow =
        Math.abs(arrowCycle - arrowCenter) <
        textureConfig.arrowLineWidth;
      const value = isArrow
        ? textureConfig.arrowValue
        : stripe > textureConfig.stripeThreshold
          ? textureConfig.stripeValue
          : textureConfig.baseValue;

      data[dataIndex] = value;
      data[dataIndex + 1] = value;
      data[dataIndex + 2] = value;
      data[dataIndex + 3] = textureConfig.alphaValue;
      dataIndex += 4;
    }
  }

  const texture = new DataTexture(
    data,
    size,
    size,
    RGBAFormat,
    UnsignedByteType
  );
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(
    textureConfig.repeatAlong,
    textureConfig.repeatAround
  );
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  texture.name = "vessel-flow-texture";
  return texture;
}

function validateLevelRoute(level) {
  if (!isLevelData(level)) {
    throw new TypeError("VesselTrack requires valid level data.");
  }

  let expectedStartDistance = level.start.distance;
  let expectedStartRatio = 0;

  level.sections.forEach((section) => {
    if (
      section.startDistance !== expectedStartDistance ||
      section.startRatio !== expectedStartRatio
    ) {
      throw new RangeError("Level track sections must be contiguous.");
    }

    expectedStartDistance = section.endDistance;
    expectedStartRatio = section.endRatio;
  });

  if (
    expectedStartDistance !== level.end.distance ||
    expectedStartRatio !== 1
  ) {
    throw new RangeError("Level track sections must span the full route.");
  }
}

export class VesselTrack {
  #config;
  #frames;
  #flowTexture;

  constructor({
    level,
    config = GAME_CONFIG.vessel,
    palette = GAME_CONFIG.palette
  } = {}) {
    validateLevelRoute(level);

    if (
      config.sectionOverlap < GAME_CONFIG.track.sectionOverlapMin ||
      config.sectionOverlap > GAME_CONFIG.track.sectionOverlapMax
    ) {
      throw new RangeError("Track overlap is outside the configured range.");
    }

    this.level = level;
    this.#config = config;
    this.trackLength = level.trackLength;
    this.startDistance = level.start.distance;
    this.endDistance = level.end.distance;
    this.group = new Group();
    this.group.name = "level-" + level.id + "-vessel";
    this.curve = new CatmullRomCurve3(
      level.controlPoints.map(
        ([x, y, z]) => new Vector3(x, y, z)
      ),
      false,
      config.curveType,
      config.curveTension
    );
    this.#frames = this.#buildParallelTransportFrames();
    this.#flowTexture = createFlowTexture(config.flowTexture);

    const overlapRatio = config.sectionOverlap / level.trackLength;

    this.sections = level.sections.map((definition, index) => {
      const renderStartRatio = Math.max(
        0,
        definition.startRatio - (index === 0 ? 0 : overlapRatio)
      );
      const renderEndRatio = Math.min(
        1,
        definition.endRatio +
          (index === level.sections.length - 1 ? 0 : overlapRatio)
      );
      const section = new TrackSection({
        definition,
        curve: this.curve,
        trackLength: level.trackLength,
        renderStartRatio,
        renderEndRatio,
        radialSegments: config.radialSegments,
        tubularSegmentsPerWorldUnit:
          config.tubularSegmentsPerWorldUnit,
        minimumTubularSegments: config.minimumTubularSegments,
        materialConfig: config.material,
        emissiveColor: palette.vesselEmissive,
        flowTexture: this.#flowTexture,
        getFrameAtRatio: (ratio) => this.getFrameAtRatio(ratio),
        colorStart: definition.colorStart,
        colorEnd: definition.colorEnd
      });

      this.group.add(section.mesh);
      return section;
    });
    this.setGasExchangeStatus(GAS_EXCHANGE_STATUS.PENDING);
  }

  get cachedFrameCount() {
    return this.#frames.length;
  }

  get flowTexture() {
    return this.#flowTexture;
  }

  get curveLength() {
    return this.curve.getLength();
  }

  getFrameAtDistance(distanceAlongTrack) {
    return this.getFrameAtRatio(
      distanceToNormalizedProgress(
        distanceAlongTrack,
        this.trackLength
      )
    );
  }

  getFrameAtRatio(ratio) {
    const clampedRatio = clampUnit(ratio);
    const scaledIndex =
      clampedRatio * this.#config.frameSampleCount;
    const lowerIndex = Math.floor(scaledIndex);
    const upperIndex = Math.min(
      this.#config.frameSampleCount,
      lowerIndex + 1
    );
    const alpha = scaledIndex - lowerIndex;
    const lower = this.#frames[lowerIndex];
    const upper = this.#frames[upperIndex];
    const point = lower.point.clone().lerp(upper.point, alpha);
    const tangent = lower.tangent.clone().lerp(
      upper.tangent,
      alpha
    ).normalize();
    const right = lower.right.clone().lerp(upper.right, alpha);

    right.addScaledVector(tangent, -right.dot(tangent)).normalize();

    return {
      point,
      tangent,
      right,
      up: right.clone().cross(tangent).normalize()
    };
  }

  getSectionAtDistance(distanceAlongTrack) {
    const clampedDistance =
      distanceToNormalizedProgress(
        distanceAlongTrack,
        this.trackLength
      ) * this.trackLength;

    return (
      this.sections.find((section) =>
        section.containsDistance(clampedDistance)
      ) ?? this.sections[this.sections.length - 1]
    );
  }

  getRadiusAtDistance(distanceAlongTrack) {
    return this.getSectionAtDistance(distanceAlongTrack).radius;
  }

  getColorAtDistance(distanceAlongTrack, target = new Color()) {
    return this.getSectionAtDistance(
      distanceAlongTrack
    ).getColorAtDistance(distanceAlongTrack, target);
  }

  setGasExchangeStatus(status) {
    if (!Object.values(GAS_EXCHANGE_STATUS).includes(status)) {
      throw new RangeError("Unknown gas exchange status: " + status);
    }

    const gasSectionIndex = this.sections.findIndex(
      (section) => section.gasExchangeZone !== null
    );

    if (gasSectionIndex < 0) {
      throw new Error("The level has no configured gas exchange section.");
    }

    this.sections.forEach((section) => section.resetDisplayColors());

    if (status !== GAS_EXCHANGE_STATUS.SUCCESS) {
      const beforeExchangeColor =
        this.sections[gasSectionIndex].initialColorStart;

      this.sections.slice(gasSectionIndex).forEach((section) => {
        section.setDisplayColors(
          beforeExchangeColor,
          beforeExchangeColor
        );
      });
    }

    this.gasExchangeStatus = status;
    return status;
  }

  getWorldPosition(distanceAlongTrack, lateralX, lateralY) {
    const frame = this.getFrameAtDistance(distanceAlongTrack);
    return frame.point
      .clone()
      .addScaledVector(frame.right, lateralX)
      .addScaledVector(frame.up, lateralY);
  }

  update(simulationDeltaSeconds) {
    this.#flowTexture.offset.x -=
      this.#config.flowTexture.offsetSpeed * simulationDeltaSeconds;
  }

  resetForRetry() {
    this.#flowTexture.offset.set(0, 0);
    this.setGasExchangeStatus(GAS_EXCHANGE_STATUS.PENDING);
  }

  dispose() {
    this.sections.forEach((section) => section.dispose());
    this.#flowTexture.dispose();
    this.group.clear();
  }

  #buildParallelTransportFrames() {
    const frames = [];
    const sampleCount = this.#config.frameSampleCount;
    const epsilon = this.#config.frameEpsilon;
    const worldUp = new Vector3(0, 1, 0);
    const worldRight = new Vector3(1, 0, 0);
    let previousTangent = null;
    let previousRight = null;

    for (let index = 0; index <= sampleCount; index += 1) {
      const ratio = index / sampleCount;
      const point = this.curve.getPointAt(ratio);
      const tangent = this.curve.getTangentAt(ratio).normalize();
      let right;

      if (previousTangent === null) {
        const referenceAxis =
          Math.abs(tangent.dot(worldUp)) <
          this.#config.frameReferenceAxisDotThreshold
            ? worldUp
            : worldRight;
        right = tangent.clone().cross(referenceAxis).normalize();
      } else {
        const rotationAxis = previousTangent
          .clone()
          .cross(tangent);
        const axisLength = rotationAxis.length();
        right = previousRight.clone();

        if (axisLength > epsilon) {
          rotationAxis.divideScalar(axisLength);
          const angle = Math.acos(
            Math.min(1, Math.max(-1, previousTangent.dot(tangent)))
          );
          right.applyAxisAngle(rotationAxis, angle);
        }

        right
          .addScaledVector(tangent, -right.dot(tangent))
          .normalize();
      }

      const up = right.clone().cross(tangent).normalize();
      frames.push({ point, tangent, right, up });
      previousTangent = tangent;
      previousRight = right;
    }

    return frames;
  }
}
