import {
  DataTexture,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  RGBAFormat,
  SphereGeometry,
  SRGBColorSpace,
  UnsignedByteType,
  Group
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

const RBC_GLYPHS = Object.freeze({
  R: [
    "11110",
    "10001",
    "10001",
    "11110",
    "10100",
    "10010",
    "10001"
  ],
  B: [
    "11110",
    "10001",
    "10001",
    "11110",
    "10001",
    "10001",
    "11110"
  ],
  C: [
    "01111",
    "10000",
    "10000",
    "10000",
    "10000",
    "10000",
    "01111"
  ]
});

export function createRbcLabelTexture(
  labelConfig = GAME_CONFIG.playerModel.label
) {
  const glyphOrder = ["R", "B", "C"];
  const logicalWidth =
    labelConfig.padding * 2 +
    labelConfig.glyphWidth * glyphOrder.length +
    labelConfig.glyphSpacing * (glyphOrder.length - 1);
  const logicalHeight =
    labelConfig.padding * 2 + labelConfig.glyphHeight;
  const textureWidth = logicalWidth * labelConfig.pixelScale;
  const textureHeight = logicalHeight * labelConfig.pixelScale;
  const data = new Uint8Array(textureWidth * textureHeight * 4);
  const background = labelConfig.backgroundRgba;
  const foreground = labelConfig.foregroundRgba;

  for (let pixelIndex = 0; pixelIndex < data.length; pixelIndex += 4) {
    data[pixelIndex] = background[0];
    data[pixelIndex + 1] = background[1];
    data[pixelIndex + 2] = background[2];
    data[pixelIndex + 3] = background[3];
  }

  glyphOrder.forEach((glyphName, glyphIndex) => {
    const rows = RBC_GLYPHS[glyphName];
    const glyphStartX =
      labelConfig.padding +
      glyphIndex *
        (labelConfig.glyphWidth + labelConfig.glyphSpacing);

    rows.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel !== "1") {
          return;
        }

        const logicalX = glyphStartX + columnIndex;
        const logicalY = labelConfig.padding + rowIndex;
        const flippedLogicalY = logicalHeight - logicalY - 1;

        for (
          let scaleY = 0;
          scaleY < labelConfig.pixelScale;
          scaleY += 1
        ) {
          for (
            let scaleX = 0;
            scaleX < labelConfig.pixelScale;
            scaleX += 1
          ) {
            const textureX =
              logicalX * labelConfig.pixelScale + scaleX;
            const textureY =
              flippedLogicalY * labelConfig.pixelScale + scaleY;
            const dataIndex =
              (textureY * textureWidth + textureX) * 4;
            data[dataIndex] = foreground[0];
            data[dataIndex + 1] = foreground[1];
            data[dataIndex + 2] = foreground[2];
            data[dataIndex + 3] = foreground[3];
          }
        }
      });
    });
  });

  const texture = new DataTexture(
    data,
    textureWidth,
    textureHeight,
    RGBAFormat,
    UnsignedByteType
  );
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  texture.name = "procedural-rbc-label";
  return texture;
}

export class HoodController {
  constructor({
    config = GAME_CONFIG.playerModel,
    palette = GAME_CONFIG.palette,
    malariaConfig = GAME_CONFIG.malaria,
    bloodRuptureConfig = GAME_CONFIG.bloodRupture,
    timingConfig = GAME_CONFIG.timing
  } = {}) {
    const cockpit = config.cockpit;
    const hood = config.hood;

    this.closedAngleRadians = hood.closedAngleRadians;
    this.malariaConfig = malariaConfig;
    this.bloodRuptureConfig = bloodRuptureConfig;
    this.timingConfig = timingConfig;
    this.obstructionStartedAtMs = null;
    this.obstructionExpiresAtMs = null;
    this.restoreStartedAtMs = null;
    this.restoreExpiresAtMs = null;
    this.qteModeActive = false;
    this.combinedEffectActive = false;

    this.group = new Group();
    this.group.name = "independent-rbc-hood";
    this.group.position.fromArray(hood.pivotPosition);
    this.group.rotation.x = this.closedAngleRadians;
    this.group.userData.independentHood = true;
    this.group.userData.hingeOffset = [...hood.hingeOffset];

    this.geometry = new SphereGeometry(
      cockpit.sphereRadius,
      cockpit.widthSegments,
      cockpit.heightSegments
    );
    this.material = new MeshStandardMaterial({
      color: palette.oxygenatedRed,
      roughness: cockpit.noseRoughness,
      metalness: cockpit.noseMetalness
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.name = "rbc-hood-shell";
    this.mesh.position.fromArray(hood.meshPosition);
    this.mesh.scale.fromArray(hood.meshScale);
    this.mesh.renderOrder = hood.renderOrder;
    this.group.add(this.mesh);
    this.basePosition = this.group.position.clone();
    this.baseMeshScale = this.mesh.scale.clone();
    this.restoreFrom = {
      rotationX: this.closedAngleRadians,
      rotationZ: 0,
      positionY: this.basePosition.y
    };
    this.group.userData.screenCoverageMinimum =
      this.malariaConfig.minimumScreenCoverage;
    this.group.userData.screenCoverageLimit =
      this.malariaConfig.maximumScreenCoverage;
  }

  get isBasicObstructionActive() {
    return this.obstructionExpiresAtMs !== null;
  }

  get isRestoring() {
    return this.restoreExpiresAtMs !== null;
  }

  get currentCoverageLimit() {
    return this.combinedEffectActive
      ? this.malariaConfig.combinedMaximumCoverage
      : this.malariaConfig.maximumScreenCoverage;
  }

  get animationDiagnostics() {
    return Object.freeze({
      active: this.isBasicObstructionActive,
      restoring: this.isRestoring,
      qteModeActive: this.qteModeActive,
      combinedEffectActive: this.combinedEffectActive,
      coverageLimit: this.currentCoverageLimit,
      rotationX: this.group.rotation.x,
      rotationZ: this.group.rotation.z,
      offsetY: this.group.position.y - this.basePosition.y,
      restoreExpiresAtMs: this.restoreExpiresAtMs
    });
  }

  triggerBasicObstruction(nowMs) {
    return this.#triggerObstruction(
      nowMs,
      this.malariaConfig.obstructionDurationSeconds
    );
  }

  triggerBloodRupture(nowMs) {
    return this.#triggerObstruction(
      nowMs,
      this.malariaConfig.obstructionDurationSeconds *
        this.bloodRuptureConfig.hoodDurationMultiplier
    );
  }

  #triggerObstruction(nowMs, durationSeconds) {
    if (!Number.isFinite(nowMs)) {
      throw new TypeError("Malaria obstruction requires an absolute time.");
    }

    this.obstructionStartedAtMs = nowMs;
    const requestedExpiry =
      nowMs +
      durationSeconds * this.timingConfig.millisecondsPerSecond;
    this.obstructionExpiresAtMs = Math.max(
      this.obstructionExpiresAtMs ?? 0,
      requestedExpiry
    );
    this.restoreStartedAtMs = null;
    this.restoreExpiresAtMs = null;
    this.#syncCoverageScale();
    this.#applyFlapTransform(nowMs);
    this.group.visible = !this.qteModeActive;
    return this.obstructionExpiresAtMs;
  }

  update(nowMs) {
    if (!Number.isFinite(nowMs)) {
      throw new TypeError("Hood updates require an absolute time.");
    }

    if (this.obstructionExpiresAtMs !== null) {
      if (nowMs >= this.obstructionExpiresAtMs) {
        this.#beginRestore(this.obstructionExpiresAtMs);
      } else {
        this.#applyFlapTransform(nowMs);
      }
    }

    if (this.restoreExpiresAtMs !== null) {
      if (nowMs >= this.restoreExpiresAtMs) {
        this.#completeRestore();
      } else {
        this.#applyRestoreTransform(nowMs);
      }
    }

    this.group.visible = !this.qteModeActive;
    return this.isBasicObstructionActive;
  }

  clearBasicObstruction() {
    this.obstructionStartedAtMs = null;
    this.obstructionExpiresAtMs = null;
    this.restoreStartedAtMs = null;
    this.restoreExpiresAtMs = null;
    this.#syncCoverageScale();
    this.#setClosedTransform();
  }

  setQteMode(active) {
    if (typeof active !== "boolean") {
      throw new TypeError("QTE hood mode requires a boolean.");
    }

    this.qteModeActive = active;
    this.group.visible = !active;

    if (!active && !this.isBasicObstructionActive && !this.isRestoring) {
      this.#setClosedTransform();
    }

    return this.qteModeActive;
  }

  setCombinedEffectMode(active) {
    if (typeof active !== "boolean") {
      throw new TypeError("Combined hood mode requires a boolean.");
    }

    this.combinedEffectActive = active;
    this.#syncCoverageScale();
    this.group.userData.screenCoverageLimit =
      this.currentCoverageLimit;
    return this.currentCoverageLimit;
  }

  reset() {
    this.clearBasicObstruction();
    this.setQteMode(false);
    this.setCombinedEffectMode(false);
  }

  dispose() {
    this.reset();
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }

  #getFlapTransform(nowMs) {
    const elapsedSeconds =
      (nowMs - this.obstructionStartedAtMs) /
      this.timingConfig.millisecondsPerSecond;
    return {
      rotationX:
        this.closedAngleRadians +
        this.malariaConfig.hoodOpenAngle +
        Math.sin(
          elapsedSeconds *
            this.malariaConfig.hoodPrimaryFrequency
        ) * this.malariaConfig.hoodPrimaryAmplitude +
        Math.sin(
          elapsedSeconds *
            this.malariaConfig.hoodSecondaryFrequency
        ) * this.malariaConfig.hoodSecondaryAmplitude,
      rotationZ:
        Math.sin(
          elapsedSeconds * this.malariaConfig.hoodRollFrequency
        ) * this.malariaConfig.hoodRollAmplitude,
      positionY:
        this.basePosition.y +
        Math.sin(
          elapsedSeconds * this.malariaConfig.hoodOffsetFrequency
        ) * this.malariaConfig.hoodOffsetAmplitude
    };
  }

  #applyFlapTransform(nowMs) {
    const transform = this.#getFlapTransform(nowMs);
    this.group.rotation.x = transform.rotationX;
    this.group.rotation.z = transform.rotationZ;
    this.group.position.y = transform.positionY;
  }

  #beginRestore(startedAtMs) {
    const transform = this.#getFlapTransform(startedAtMs);
    this.restoreFrom = transform;
    this.obstructionStartedAtMs = null;
    this.obstructionExpiresAtMs = null;
    this.restoreStartedAtMs = startedAtMs;
    this.restoreExpiresAtMs =
      startedAtMs +
      this.malariaConfig.restoreDurationSeconds *
        this.timingConfig.millisecondsPerSecond;
    this.#syncCoverageScale();
    this.group.rotation.x = transform.rotationX;
    this.group.rotation.z = transform.rotationZ;
    this.group.position.y = transform.positionY;
  }

  #applyRestoreTransform(nowMs) {
    const durationMs =
      this.malariaConfig.restoreDurationSeconds *
      this.timingConfig.millisecondsPerSecond;
    const progress = Math.min(
      1,
      Math.max(0, (nowMs - this.restoreStartedAtMs) / durationMs)
    );
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    this.group.rotation.x =
      this.restoreFrom.rotationX +
      (this.closedAngleRadians - this.restoreFrom.rotationX) *
        easedProgress;
    this.group.rotation.z =
      this.restoreFrom.rotationZ * (1 - easedProgress);
    this.group.position.y =
      this.restoreFrom.positionY +
      (this.basePosition.y - this.restoreFrom.positionY) *
        easedProgress;
  }

  #completeRestore() {
    this.restoreStartedAtMs = null;
    this.restoreExpiresAtMs = null;
    this.#syncCoverageScale();
    this.#setClosedTransform();
  }

  #syncCoverageScale() {
    const hasVisibleMalariaEffect =
      this.isBasicObstructionActive || this.isRestoring;
    const scale = this.combinedEffectActive && hasVisibleMalariaEffect
      ? this.malariaConfig.combinedMaximumCoverage /
        this.malariaConfig.maximumScreenCoverage
      : 1;
    this.mesh.scale.copy(this.baseMeshScale).multiplyScalar(scale);
  }

  #setClosedTransform() {
    this.group.rotation.x = this.closedAngleRadians;
    this.group.rotation.z = 0;
    this.group.position.copy(this.basePosition);
  }
}
