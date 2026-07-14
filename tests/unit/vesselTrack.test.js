import {
  CatmullRomCurve3,
  TubeGeometry
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js";
import { VesselTrack } from "../../js/world/VesselTrack.js";
import {
  assert,
  assertApproximately,
  assertEqual
} from "./TestHarness.js";

export function registerVesselTrackTests(harness) {
  harness.test("prototype vessel uses CatmullRom and segmented tubes", () => {
    const track = new VesselTrack();

    assert(track.curve instanceof CatmullRomCurve3);
    assertEqual(track.sections.length, GAME_CONFIG.prototype.sections.length);
    assertEqual(track.group.children.length, track.sections.length);
    track.sections.forEach((section) => {
      assert(section.geometry instanceof TubeGeometry);
      assertEqual(
        section.mesh.userData.usesParallelTransportFrames,
        true
      );
    });

    track.dispose();
  });

  harness.test("cached parallel-transport frames stay orthonormal", () => {
    const track = new VesselTrack();
    const sampleDistances = [0, 180, 360, 540, 720];

    assertEqual(
      track.cachedFrameCount,
      GAME_CONFIG.prototype.frameSampleCount + 1
    );
    sampleDistances.forEach((distance) => {
      const frame = track.getFrameAtDistance(distance);
      assertApproximately(frame.tangent.length(), 1, 0.000001);
      assertApproximately(frame.right.length(), 1, 0.000001);
      assertApproximately(frame.up.length(), 1, 0.000001);
      assertApproximately(frame.tangent.dot(frame.right), 0, 0.000001);
      assertApproximately(frame.tangent.dot(frame.up), 0, 0.000001);
      assertApproximately(frame.right.dot(frame.up), 0, 0.000001);
      assertApproximately(
        frame.right.clone().cross(frame.tangent).dot(frame.up),
        1,
        0.000001
      );
    });

    track.dispose();
  });

  harness.test("track offsets use the cached local frame", () => {
    const track = new VesselTrack();
    const distance = 240;
    const frame = track.getFrameAtDistance(distance);
    const worldPosition = track.getWorldPosition(distance, 2, -1);
    const expected = frame.point
      .clone()
      .addScaledVector(frame.right, 2)
      .addScaledVector(frame.up, -1);

    assertApproximately(worldPosition.distanceTo(expected), 0, 0.000001);
    track.dispose();
  });

  harness.test("flow texture advances only when the track is updated", () => {
    const track = new VesselTrack();
    const initialOffset = track.flowTexture.offset.x;

    track.update(2);
    assertApproximately(
      track.flowTexture.offset.x,
      initialOffset - GAME_CONFIG.prototype.flowTexture.offsetSpeed * 2,
      Number.EPSILON
    );
    track.dispose();
    assertEqual(track.group.children.length, 0);
  });
}
