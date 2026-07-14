import { Vector3 } from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js";
import { InputController } from "../../js/input/InputController.js";
import { PlayerRBC } from "../../js/player/PlayerRBC.js";
import {
  assert,
  assertApproximately,
  assertEqual
} from "./TestHarness.js";

function createStraightTrack() {
  return {
    trackLength: GAME_CONFIG.prototype.trackLength,
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
}
