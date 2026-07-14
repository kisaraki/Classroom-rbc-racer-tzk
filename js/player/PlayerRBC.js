import {
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
import { GAME_CONFIG } from "../config.js?v=phase04-rbc-mobile";
import { createPlayerState } from "../data/schemas.js?v=phase04-rbc-mobile";
import {
  getSpeedForBloodPressure,
  updateBloodPressure
} from "../systems/BloodPressureSystem.js";
import { clampLateralOffset } from "../world/TrackMath.js";
import {
  createRbcLabelTexture,
  HoodController
} from "./HoodController.js?v=phase04-rbc-mobile";

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

  constructor({
    config = GAME_CONFIG,
    stateOverrides = {}
  } = {}) {
    this.config = config;
    this.state = createPlayerState(stateOverrides);
    this.speed = getSpeedForBloodPressure(this.state.bp, config);
    this.hitWall = false;
    this.worldGroup = new Group();
    this.worldGroup.name = "player-rbc-world-model";
    this.cockpitGroup = new Group();
    this.cockpitGroup.name = "player-rbc-first-person-cockpit";

    const modelConfig = config.playerModel;
    const labelTexture = createRbcLabelTexture(modelConfig.label);
    this.labelTexture = labelTexture;

    const bodyGeometry = createBiconcaveGeometry(modelConfig);
    const bodyMaterial = new MeshStandardMaterial({
      color: config.palette.rbcBody,
      roughness: modelConfig.bodyRoughness,
      metalness: modelConfig.bodyMetalness
    });
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
      color: config.palette.rbcBody,
      roughness: cockpit.noseRoughness,
      metalness: cockpit.noseMetalness,
      emissive: config.palette.cockpitShadow
    });
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
      palette: config.palette
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
    this.state.bp = updateBloodPressure(
      this.state.bp,
      input.getBloodPressureAxis(),
      simulationDeltaSeconds,
      this.config
    );
    this.speed = getSpeedForBloodPressure(this.state.bp, this.config);
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

  dispose() {
    this.hoodController.dispose();
    this.#disposables.forEach((resource) => resource.dispose());
    this.labelTexture.dispose();
    this.worldGroup.clear();
    this.cockpitGroup.clear();
  }
}
