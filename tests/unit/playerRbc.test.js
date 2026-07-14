import {
  Color,
  PerspectiveCamera,
  Vector3
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js?v=phase06-qte";
import { createLevelCheckpoint } from "../../js/data/schemas.js?v=phase06-qte";
import { InputController } from "../../js/input/InputController.js";
import { PlayerRBC } from "../../js/player/PlayerRBC.js?v=phase06-qte";
import {
  assert,
  assertApproximately,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

function createStraightTrack() {
  return {
    trackLength: GAME_CONFIG.levels[1].trackLength,
    getRadiusAtDistance: () => GAME_CONFIG.track.radii.greatVessel,
    getFrameAtDistance: (distance) => ({
      point: new Vector3(0, 0, -distance),
      tangent: new Vector3(0, 0, -1),
      right: new Vector3(1, 0, 0),
      up: new Vector3(0, 1, 0)
    })
  };
}

function colorDistance(first, second) {
  return Math.hypot(
    first.r - second.r,
    first.g - second.g,
    first.b - second.b
  );
}

export function registerPlayerRbcTests(harness) {
  harness.test("PlayerRBC builds a biconcave model and separate hood", () => {
    const player = new PlayerRBC();

    assertEqual(player.bodyMesh.geometry.type, "LatheGeometry");
    assertEqual(player.bodyMesh.name, "biconcave-rbc-body");
    assertEqual(
      player.hoodController.group.userData.independentHood,
      true
    );
    assertEqual(
      player.hoodController.group.parent,
      player.cockpitGroup
    );
    assert(
      player.hoodController.group !== player.noseMesh,
      "Hood must not be the main cockpit nose."
    );
    assert(
      player.labelTexture.image.data.some((value) => value > 0),
      "Procedural RBC label must contain visible pixels."
    );

    player.dispose();
  });

  harness.test("PlayerRBC advances canonical distance and local offsets", () => {
    const player = new PlayerRBC();
    const input = new InputController({ target: null });
    const track = createStraightTrack();
    const maximumLateralOffset =
      GAME_CONFIG.track.radii.greatVessel -
      GAME_CONFIG.track.playerCollisionRadius -
      GAME_CONFIG.track.wallMargin;
    input.setPressed("KeyZ", true);
    input.setPressed("ArrowRight", true);

    player.update(1, input, track);
    assertApproximately(player.state.bp, 118, Number.EPSILON);
    assertApproximately(player.speed, 11.8, Number.EPSILON);
    assertApproximately(
      player.state.distanceAlongTrack,
      11.8,
      Number.EPSILON
    );
    assertApproximately(player.state.lateralX, 4.5, Number.EPSILON);

    player.update(1, input, track);
    assertApproximately(
      player.state.previousDistanceAlongTrack,
      11.8,
      Number.EPSILON
    );
    assertApproximately(
      player.state.lateralX,
      maximumLateralOffset,
      Number.EPSILON
    );
    assertEqual(player.hitWall, true);
    player.dispose();
  });

  harness.test("smaller RBC leaves more avoidance room in capillaries", () => {
    const player = new PlayerRBC();
    const capillaryRadius =
      GAME_CONFIG.track.radii.systemicCapillary;
    const visualRadiusRatio =
      GAME_CONFIG.playerModel.outerRadius / capillaryRadius;
    const lateralCenterLimit =
      capillaryRadius -
      player.state.collisionRadius -
      GAME_CONFIG.track.wallMargin;

    assertEqual(
      player.state.collisionRadius,
      GAME_CONFIG.track.playerCollisionRadius
    );
    assert(
      visualRadiusRatio < 0.33,
      "RBC visual radius must stay below one third of a capillary radius."
    );
    assertApproximately(lateralCenterLimit, 2.3, 0.000000000001);
    assert(
      player.noseMesh.scale.x < 2,
      "First-person RBC nose must use the compact scale."
    );
    player.dispose();
  });

  harness.test("RBC label keeps its texture ratio and fits the camera", () => {
    const player = new PlayerRBC();
    const label = player.cockpitGroup.getObjectByName(
      "rbc-cockpit-label"
    );
    const textureAspect =
      player.labelTexture.image.width /
      player.labelTexture.image.height;
    const planeAspect =
      label.geometry.parameters.width /
      label.geometry.parameters.height;
    const camera = new PerspectiveCamera(
      GAME_CONFIG.camera.fieldOfViewDegrees,
      GAME_CONFIG.renderer.referenceWidth /
        GAME_CONFIG.renderer.referenceHeight,
      GAME_CONFIG.camera.nearClip,
      GAME_CONFIG.camera.farClip
    );
    const halfWidth = label.geometry.parameters.width / 2;
    const halfHeight = label.geometry.parameters.height / 2;
    const corners = [
      [-halfWidth, -halfHeight],
      [-halfWidth, halfHeight],
      [halfWidth, -halfHeight],
      [halfWidth, halfHeight]
    ];

    assertApproximately(planeAspect, textureAspect, 0.02);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    corners.forEach(([offsetX, offsetY]) => {
      const projected = new Vector3(
        label.position.x + offsetX,
        label.position.y + offsetY,
        label.position.z
      ).project(camera);

      assert(
        Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1,
        "Every RBC label corner must remain inside the viewport."
      );
    });
    player.dispose();
  });

  harness.test("RBC body subtly reflects the current vessel color", () => {
    const player = new PlayerRBC();
    const baseColor = new Color(GAME_CONFIG.palette.rbcBody);
    const arterialColor = new Color(
      GAME_CONFIG.palette.vesselArterial
    );
    const venousColor = new Color(GAME_CONFIG.palette.vesselVenous);

    player.updateVesselReflection(arterialColor, 0);
    const arterialBody = player.bodyMaterial.color.clone();
    const arterialEmissive = player.bodyMaterial.emissive.clone();
    const expectedTintRatio =
      GAME_CONFIG.playerModel.environmentReflection.bodyColorMix;
    const actualTintRatio =
      colorDistance(baseColor, arterialBody) /
      colorDistance(baseColor, arterialColor);

    assertApproximately(
      actualTintRatio,
      expectedTintRatio,
      0.000001
    );
    player.updateVesselReflection(venousColor, 1);
    assert(
      colorDistance(arterialBody, player.bodyMaterial.color) > 0.01,
      "Arterial and venous sections must produce distinct body highlights."
    );
    assert(
      colorDistance(arterialEmissive, player.bodyMaterial.emissive) > 0.01,
      "Vessel reflection must also alter the subtle emissive highlight."
    );
    assertEqual(
      player.reflectionDiagnostics.environmentColor,
      "#" + venousColor.getHexString()
    );
    player.dispose();
  });

  harness.test("vessel reflection transitions smoothly between colors", () => {
    const player = new PlayerRBC();
    const arterialColor = new Color(
      GAME_CONFIG.palette.vesselArterial
    );
    const venousColor = new Color(GAME_CONFIG.palette.vesselVenous);
    player.updateVesselReflection(arterialColor, 0);
    const initialBodyColor = player.bodyMaterial.color.clone();

    player.updateVesselReflection(venousColor, 0);
    assertEqual(
      player.bodyMaterial.color.equals(initialBodyColor),
      true
    );
    player.updateVesselReflection(venousColor, 0.1);
    assert(
      colorDistance(initialBodyColor, player.bodyMaterial.color) > 0,
      "A positive render delta must begin the color transition."
    );
    assertThrows(
      () => player.updateVesselReflection(venousColor, -1),
      RangeError
    );
    player.dispose();
  });

  harness.test("malaria hood uses an absolute five-second deadline", () => {
    const player = new PlayerRBC();
    const hood = player.hoodController;
    const expiresAtMs = hood.triggerBasicObstruction(1000);

    assertEqual(expiresAtMs, 6000);
    assertEqual(hood.isBasicObstructionActive, true);
    assertApproximately(
      hood.group.rotation.x,
      GAME_CONFIG.malaria.hoodOpenAngle,
      Number.EPSILON
    );
    assertEqual(hood.update(5999), true);
    assertEqual(hood.update(6000), false);
    assertApproximately(hood.group.rotation.x, 0, Number.EPSILON);
    player.dispose();
  });

  harness.test("a repeated malaria hit refreshes the hood deadline", () => {
    const player = new PlayerRBC();
    const hood = player.hoodController;
    hood.triggerBasicObstruction(1000);

    assertEqual(hood.triggerBasicObstruction(3000), 8000);
    assertEqual(hood.update(6000), true);
    assertEqual(hood.update(8000), false);
    assertThrows(() => hood.update(Number.NaN), TypeError);
    player.dispose();
  });

  harness.test("QTE hides the hood without stopping its absolute deadline", () => {
    const player = new PlayerRBC();
    const hood = player.hoodController;
    hood.triggerBasicObstruction(1000);

    assertEqual(hood.setQteMode(true), true);
    assertEqual(hood.group.visible, false);
    assertEqual(hood.update(6000), false);
    assertEqual(hood.setQteMode(false), false);
    assertEqual(hood.group.visible, true);
    assertThrows(() => hood.setQteMode("yes"), TypeError);
    player.dispose();
  });

  harness.test("checkpoint retry restores canonical Level 1 player state", () => {
    const player = new PlayerRBC();
    const checkpoint = createLevelCheckpoint(
      player.state,
      GAME_CONFIG.levels[1].seed
    );
    player.state.hp = 0;
    player.state.bp = GAME_CONFIG.bp.max;
    player.state.score = 99;
    player.state.distanceAlongTrack = 850;
    player.state.gasExchangeAttempts = 2;
    player.hoodController.triggerBasicObstruction(1000);

    const state = player.resetForCheckpoint(checkpoint);

    assertEqual(state.hp, GAME_CONFIG.hp.initial);
    assertEqual(state.bp, GAME_CONFIG.bp.initial);
    assertEqual(state.score, GAME_CONFIG.score.initial);
    assertEqual(state.distanceAlongTrack, 0);
    assertEqual(state.gasExchangeAttempts, 0);
    assertEqual(player.hoodController.isBasicObstructionActive, false);
    assertEqual(player.hoodController.group.visible, true);
    assertThrows(() => player.resetForCheckpoint({}), TypeError);
    player.dispose();
  });
}
