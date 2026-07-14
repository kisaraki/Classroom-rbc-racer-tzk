import { Vector3 } from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js?v=phase04-entities";
import { InputController } from "../../js/input/InputController.js";
import { PlayerRBC } from "../../js/player/PlayerRBC.js?v=phase04-entities";
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
    assertApproximately(player.state.lateralX, 4.5, Number.EPSILON);
    assertEqual(player.hitWall, true);
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
}
