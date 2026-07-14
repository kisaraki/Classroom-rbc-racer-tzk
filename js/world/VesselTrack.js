import {
  CatmullRomCurve3,
  DataTexture,
  Group,
  LinearFilter,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  UnsignedByteType,
  Vector3
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js";
import { distanceToNormalizedProgress } from "./TrackMath.js";
import { TrackSection } from "./TrackSection.js";

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
  texture.name = "prototype-vessel-flow-texture";
  return texture;
}

function validateSections(sectionDefinitions) {
  if (!Array.isArray(sectionDefinitions) || sectionDefinitions.length === 0) {
    throw new TypeError("Prototype track requires section definitions.");
  }

  let expectedStartRatio = 0;

  sectionDefinitions.forEach((section) => {
    if (
      section.startRatio !== expectedStartRatio ||
      section.endRatio <= section.startRatio ||
      section.radius <= 0
    ) {
      throw new RangeError(
        "Prototype track sections must be contiguous and positive."
      );
    }

    expectedStartRatio = section.endRatio;
  });

  if (expectedStartRatio !== 1) {
    throw new RangeError("Prototype track sections must end at ratio 1.");
  }
}

export class VesselTrack {
  #config;
  #frames;
  #flowTexture;

  constructor({
    config = GAME_CONFIG.prototype,
    palette = GAME_CONFIG.palette
  } = {}) {
    validateSections(config.sections);
    this.#config = config;
    this.trackLength = config.trackLength;
    this.group = new Group();
    this.group.name = "phase-01-prototype-vessel";
    this.curve = new CatmullRomCurve3(
      config.controlPoints.map(
        ([x, y, z]) => new Vector3(x, y, z)
      ),
      false,
      config.curveType,
      config.curveTension
    );
    this.#frames = this.#buildParallelTransportFrames();
    this.#flowTexture = createFlowTexture(config.flowTexture);

    const overlapRatio = config.sectionOverlap / config.trackLength;

    this.sections = config.sections.map((definition, index) => {
      const renderStartRatio = Math.max(
        0,
        definition.startRatio - (index === 0 ? 0 : overlapRatio)
      );
      const renderEndRatio = Math.min(
        1,
        definition.endRatio -
          (index === config.sections.length - 1 ? 0 : -overlapRatio)
      );
      const section = new TrackSection({
        definition,
        curve: this.curve,
        trackLength: config.trackLength,
        renderStartRatio,
        renderEndRatio,
        radialSegments: config.radialSegments,
        tubularSegmentsPerWorldUnit:
          config.tubularSegmentsPerWorldUnit,
        minimumTubularSegments: config.minimumTubularSegments,
        materialConfig: config.material,
        color: palette[definition.colorKey],
        emissiveColor: palette.vesselEmissive,
        flowTexture: this.#flowTexture,
        getFrameAtRatio: (ratio) => this.getFrameAtRatio(ratio)
      });

      this.group.add(section.mesh);
      return section;
    });
  }

  get cachedFrameCount() {
    return this.#frames.length;
  }

  get flowTexture() {
    return this.#flowTexture;
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
    const ratio = distanceToNormalizedProgress(
      distanceAlongTrack,
      this.trackLength
    );
    return (
      this.sections.find((section) => section.containsRatio(ratio)) ??
      this.sections[this.sections.length - 1]
    );
  }

  getRadiusAtDistance(distanceAlongTrack) {
    return this.getSectionAtDistance(distanceAlongTrack).radius;
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
