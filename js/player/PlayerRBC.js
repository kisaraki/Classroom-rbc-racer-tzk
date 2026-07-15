import {
  Color,
  DoubleSide,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import {
  createPlayerState,
  isLevelCheckpoint,
  RBC_COLOR_STATES,
  toggleRbcColorState
} from "../data/schemas.js?v=stable-v1.1-20260715-r2";
import {
  clampBloodPressure,
  getSpeedForBloodPressure,
  updateBloodPressure
} from "../systems/BloodPressureSystem.js";
import { clampLateralOffset } from "../world/TrackMath.js";
import {
  createRbcLabelTexture,
  HoodController
} from "./HoodController.js?v=stable-v1.1-20260715-r2";

function createBiconcaveGeometry(modelConfig) {
  const profile = [];

  for (
    let index = 0;
    index <= modelConfig.profileSamples;
    index += 1
  ) {
    const ratio = index / modelConfig.profileSamples;
    const radius = modelConfig.outerRadius * ratio;
    const halfThickness =
      modelConfig.centerHalfThickness +
      modelConfig.rimRise *
        Math.pow(
          Math.sin(Math.PI * ratio),
          modelConfig.profilePower
        );
    profile.push(new Vector2(radius, halfThickness));
  }

  for (
    let index = modelConfig.profileSamples;
    index >= 0;
    index -= 1
  ) {
    const ratio = index / modelConfig.profileSamples;
    const radius = modelConfig.outerRadius * ratio;
    const halfThickness =
      modelConfig.centerHalfThickness +
      modelConfig.rimRise *
        Math.pow(
          Math.sin(Math.PI * ratio),
          modelConfig.profilePower
        );
    profile.push(new Vector2(radius, -halfThickness));
  }

  const geometry = new LatheGeometry(
    profile,
    modelConfig.radialSegments
  );
  geometry.rotateX(modelConfig.bodyRotationXRadians);
  geometry.computeVertexNormals();
  return geometry;
}

function createLabelMesh(texture, labelConfig) {
  const geometry = new PlaneGeometry(
    labelConfig.planeWidth,
    labelConfig.planeHeight
  );
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: DoubleSide
  });
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = labelConfig.renderOrder;
  return { mesh, geometry, material };
}

export class PlayerRBC {
  #orientationMatrix = new Matrix4();
  #backward = new Vector3();
  #disposables = [];
  #baseBodyColor = new Color();
  #baseCockpitEmissive = new Color();
  #environmentColor = new Color();
  #reflectionTarget = new Color();
  #reflectionInitialized = false;

  constructor({
    config = GAME_CONFIG,
    stateOverrides = {}
  } = {}) {
    this.config = config;
    this.state = createPlayerState(stateOverrides);
    this.bloodPressureMaximum = config.bp.max;
    this.speed = getSpeedForBloodPressure(
      this.state.bp,
      config,
      this.bloodPressureMaximum
    );
    this.hitWall = false;
    this.worldGroup = new Group();
    this.worldGroup.name = "player-rbc-world-model";
    this.cockpitGroup = new Group();
    this.cockpitGroup.name = "player-rbc-first-person-cockpit";

    const modelConfig = config.playerModel;
    const baseBodyColor =
      this.state.rbcColorState === RBC_COLOR_STATES.RED
        ? config.palette.rbcBody
        : config.palette.rbcDeoxygenatedBody;
    const labelTexture = createRbcLabelTexture(modelConfig.label);
    this.labelTexture = labelTexture;

    const bodyGeometry = createBiconcaveGeometry(modelConfig);
    const bodyMaterial = new MeshStandardMaterial({
      color: baseBodyColor,
      roughness: modelConfig.bodyRoughness,
      metalness: modelConfig.bodyMetalness,
      emissive: config.palette.cockpitShadow,
      emissiveIntensity:
        modelConfig.environmentReflection.bodyEmissiveIntensity
    });
    this.bodyMaterial = bodyMaterial;
    this.#baseBodyColor.copy(bodyMaterial.color);
    this.bodyMesh = new Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.name = "biconcave-rbc-body";
    this.worldGroup.add(this.bodyMesh);
    this.worldGroup.visible = modelConfig.bodyVisibleInFirstPerson;
    this.#disposables.push(bodyGeometry, bodyMaterial);

    const bodyLabel = createLabelMesh(
      labelTexture,
      modelConfig.label
    );
    bodyLabel.mesh.name = "rbc-body-label";
    bodyLabel.mesh.position.fromArray(modelConfig.label.bodyPosition);
    this.worldGroup.add(bodyLabel.mesh);
    this.#disposables.push(bodyLabel.geometry, bodyLabel.material);

    const cockpit = modelConfig.cockpit;
    const noseGeometry = new SphereGeometry(
      cockpit.sphereRadius,
      cockpit.widthSegments,
      cockpit.heightSegments
    );
    const noseMaterial = new MeshStandardMaterial({
      color: baseBodyColor,
      roughness: cockpit.noseRoughness,
      metalness: cockpit.noseMetalness,
      emissive: config.palette.cockpitShadow,
      emissiveIntensity:
        modelConfig.environmentReflection.cockpitEmissiveIntensity
    });
    this.noseMaterial = noseMaterial;
    this.#baseCockpitEmissive.copy(noseMaterial.emissive);
    this.noseMesh = new Mesh(noseGeometry, noseMaterial);
    this.noseMesh.name = "rbc-first-person-nose";
    this.noseMesh.position.fromArray(cockpit.nosePosition);
    this.noseMesh.scale.fromArray(cockpit.noseScale);
    this.noseMesh.renderOrder = cockpit.renderOrder;
    this.cockpitGroup.add(this.noseMesh);
    this.#disposables.push(noseGeometry, noseMaterial);

    const trimGeometry = new TorusGeometry(
      cockpit.trimRadius,
      cockpit.trimTubeRadius,
      cockpit.trimRadialSegments,
      cockpit.trimTubularSegments
    );
    const trimMaterial = new MeshBasicMaterial({
      color: config.palette.cockpitTrim
    });
    this.trimMesh = new Mesh(trimGeometry, trimMaterial);
    this.trimMesh.name = "rbc-cockpit-trim";
    this.trimMesh.position.fromArray(cockpit.trimPosition);
    this.trimMesh.renderOrder = cockpit.renderOrder;
    this.cockpitGroup.add(this.trimMesh);
    this.#disposables.push(trimGeometry, trimMaterial);

    this.hoodController = new HoodController({
      config: modelConfig,
      palette: config.palette,
      malariaConfig: config.malaria,
      bloodRuptureConfig: config.bloodRupture,
      timingConfig: config.timing
    });
    this.cockpitGroup.add(this.hoodController.group);

    const cockpitLabel = createLabelMesh(
      labelTexture,
      modelConfig.label
    );
    cockpitLabel.mesh.name = "rbc-cockpit-label";
    cockpitLabel.mesh.position.fromArray(
      modelConfig.label.cockpitPosition
    );
    this.cockpitGroup.add(cockpitLabel.mesh);
    this.#disposables.push(
      cockpitLabel.geometry,
      cockpitLabel.material
    );
  }

  update(simulationDeltaSeconds, input, track) {
    this.adjustBloodPressure(
      input.getBloodPressureAxis(),
      simulationDeltaSeconds
    );
    this.state.previousDistanceAlongTrack =
      this.state.distanceAlongTrack;
    this.state.distanceAlongTrack = Math.min(
      track.trackLength,
      this.state.distanceAlongTrack +
        this.speed * simulationDeltaSeconds
    );

    const lateralAxes = input.getLateralAxes();
    const boundary = clampLateralOffset(
      this.state.lateralX +
        lateralAxes.x *
          this.config.movement.strafeSpeed *
          simulationDeltaSeconds,
      this.state.lateralY +
        lateralAxes.y *
          this.config.movement.strafeSpeed *
          simulationDeltaSeconds,
      track.getRadiusAtDistance(this.state.distanceAlongTrack),
      this.state.collisionRadius,
      this.config.track.wallMargin
    );
    this.state.lateralX = boundary.lateralX;
    this.state.lateralY = boundary.lateralY;
    this.hitWall = boundary.hitWall;
    this.syncWorldTransform(track.getFrameAtDistance(
      this.state.distanceAlongTrack
    ));
  }

  adjustBloodPressure(adjustmentAxis, deltaSeconds) {
    this.state.bp = updateBloodPressure(
      this.state.bp,
      adjustmentAxis,
      deltaSeconds,
      this.config,
      this.bloodPressureMaximum
    );
    this.speed = getSpeedForBloodPressure(
      this.state.bp,
      this.config,
      this.bloodPressureMaximum
    );
    return this.state.bp;
  }

  setBloodPressure(bp) {
    this.state.bp = clampBloodPressure(
      bp,
      this.config,
      this.bloodPressureMaximum
    );
    this.speed = getSpeedForBloodPressure(
      this.state.bp,
      this.config,
      this.bloodPressureMaximum
    );
    return this.state.bp;
  }

  setBloodPressureMaximum(maximum) {
    this.bloodPressureMaximum = clampBloodPressure(
      maximum,
      this.config,
      this.config.bp.max
    );
    this.state.bp = clampBloodPressure(
      this.state.bp,
      this.config,
      this.bloodPressureMaximum
    );
    this.speed = getSpeedForBloodPressure(
      this.state.bp,
      this.config,
      this.bloodPressureMaximum
    );
    return this.bloodPressureMaximum;
  }

  completeGasExchange() {
    this.state.rbcColorState = toggleRbcColorState(
      this.state.rbcColorState
    );
    this.#syncBaseBodyColor();
    return this.state.rbcColorState;
  }

  updateVesselReflection(vesselColor, elapsedSeconds) {
    if (!vesselColor?.isColor) {
      throw new TypeError("Vessel reflection requires a Three.js Color.");
    }

    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
      throw new RangeError(
        "Reflection elapsedSeconds must be finite and non-negative."
      );
    }

    const reflection = this.config.playerModel.environmentReflection;
    const response = this.#reflectionInitialized
      ? 1 - Math.exp(-reflection.responsePerSecond * elapsedSeconds)
      : 1;

    this.#environmentColor.copy(vesselColor);
    this.#reflectionTarget
      .copy(this.#baseBodyColor)
      .lerp(vesselColor, reflection.bodyColorMix);
    this.bodyMaterial.color.lerp(this.#reflectionTarget, response);
    this.bodyMaterial.emissive.lerp(vesselColor, response);

    this.#reflectionTarget
      .copy(this.#baseBodyColor)
      .lerp(vesselColor, reflection.cockpitColorMix);
    this.noseMaterial.color.lerp(this.#reflectionTarget, response);
    this.#reflectionTarget
      .copy(this.#baseCockpitEmissive)
      .lerp(vesselColor, reflection.cockpitEmissiveMix);
    this.noseMaterial.emissive.lerp(
      this.#reflectionTarget,
      response
    );
    this.#reflectionInitialized = true;
    return this.reflectionDiagnostics;
  }

  get reflectionDiagnostics() {
    return Object.freeze({
      environmentColor: "#" + this.#environmentColor.getHexString(),
      bodyColor: "#" + this.bodyMaterial.color.getHexString(),
      cockpitColor: "#" + this.noseMaterial.color.getHexString(),
      rbcColorState: this.state.rbcColorState
    });
  }

  syncWorldTransform(frame) {
    this.worldGroup.position
      .copy(frame.point)
      .addScaledVector(frame.right, this.state.lateralX)
      .addScaledVector(frame.up, this.state.lateralY);
    this.#backward.copy(frame.tangent).negate();
    this.#orientationMatrix.makeBasis(
      frame.right,
      frame.up,
      this.#backward
    );
    this.worldGroup.quaternion.setFromRotationMatrix(
      this.#orientationMatrix
    );
  }

  resetForCheckpoint(checkpoint) {
    if (!isLevelCheckpoint(checkpoint)) {
      throw new TypeError("Player reset requires a valid level checkpoint.");
    }

    const retryHp = Math.min(
      this.config.hp.max,
      Math.max(checkpoint.hp, this.config.checkpoint.retryMinimumHp)
    );
    this.state = createPlayerState({
      hp: retryHp,
      score: checkpoint.score,
      currentLevel: checkpoint.levelId,
      rbcColorState: checkpoint.rbcColorState
    });
    this.bloodPressureMaximum = this.config.bp.max;
    this.speed = getSpeedForBloodPressure(
      this.state.bp,
      this.config,
      this.bloodPressureMaximum
    );
    this.hitWall = false;
    this.hoodController.reset();
    this.#syncBaseBodyColor();
    this.bodyMaterial.emissive.set(this.config.palette.cockpitShadow);
    this.noseMaterial.emissive.copy(this.#baseCockpitEmissive);
    return this.state;
  }

  #syncBaseBodyColor() {
    const color =
      this.state.rbcColorState === RBC_COLOR_STATES.RED
        ? this.config.palette.rbcBody
        : this.config.palette.rbcDeoxygenatedBody;
    this.#baseBodyColor.set(color);
    this.bodyMaterial.color.copy(this.#baseBodyColor);
    this.noseMaterial.color.copy(this.#baseBodyColor);
    this.#environmentColor.copy(this.#baseBodyColor);
    this.#reflectionInitialized = false;
  }

  dispose() {
    this.hoodController.dispose();
    this.#disposables.forEach((resource) => resource.dispose());
    this.labelTexture.dispose();
    this.worldGroup.clear();
    this.cockpitGroup.clear();
  }
}
