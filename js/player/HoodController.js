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
import { GAME_CONFIG } from "../config.js?v=phase04-entities";

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
    timingConfig = GAME_CONFIG.timing
  } = {}) {
    const cockpit = config.cockpit;
    const hood = config.hood;

    this.closedAngleRadians = hood.closedAngleRadians;
    this.malariaConfig = malariaConfig;
    this.timingConfig = timingConfig;
    this.obstructionExpiresAtMs = null;

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
  }

  get isBasicObstructionActive() {
    return this.obstructionExpiresAtMs !== null;
  }

  triggerBasicObstruction(nowMs) {
    if (!Number.isFinite(nowMs)) {
      throw new TypeError("Malaria obstruction requires an absolute time.");
    }

    this.obstructionExpiresAtMs =
      nowMs +
      this.malariaConfig.obstructionDurationSeconds *
        this.timingConfig.millisecondsPerSecond;
    this.group.rotation.x =
      this.closedAngleRadians + this.malariaConfig.hoodOpenAngle;
    return this.obstructionExpiresAtMs;
  }

  update(nowMs) {
    if (!Number.isFinite(nowMs)) {
      throw new TypeError("Hood updates require an absolute time.");
    }

    if (
      this.obstructionExpiresAtMs !== null &&
      nowMs >= this.obstructionExpiresAtMs
    ) {
      this.clearBasicObstruction();
    }

    return this.isBasicObstructionActive;
  }

  clearBasicObstruction() {
    this.obstructionExpiresAtMs = null;
    this.group.rotation.x = this.closedAngleRadians;
  }

  dispose() {
    this.clearBasicObstruction();
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}
