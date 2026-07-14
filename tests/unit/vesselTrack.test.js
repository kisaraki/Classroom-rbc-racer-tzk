import {
  CatmullRomCurve3,
  Color,
  TubeGeometry
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js?v=phase05-bp-reflection";
import { LEVELS } from "../../js/data/levels.js?v=phase05-bp-reflection";
import { VesselTrack } from "../../js/world/VesselTrack.js?v=phase05-bp-reflection";
import {
  assert,
  assertApproximately,
  assertEqual
} from "./TestHarness.js";

function createFirstLevelTrack() {
  return new VesselTrack({ level: LEVELS[0] });
}

function assertAttributeColor(attribute, index, expectedHex) {
  const expected = new Color(expectedHex);

  assertApproximately(attribute.getX(index), expected.r, 0.000001);
  assertApproximately(attribute.getY(index), expected.g, 0.000001);
  assertApproximately(attribute.getZ(index), expected.b, 0.000001);
}

export function registerVesselTrackTests(harness) {
  harness.test("level one vessel uses CatmullRom and eight tube sections", () => {
    const track = createFirstLevelTrack();

    assert(track.curve instanceof CatmullRomCurve3);
    assertEqual(track.trackLength, GAME_CONFIG.levels[1].trackLength);
    assertEqual(track.sections.length, LEVELS[0].sections.length);
    assertEqual(track.group.children.length, track.sections.length);
    track.sections.forEach((section) => {
      assert(section.geometry instanceof TubeGeometry);
      assertEqual(section.material.vertexColors, true);
      assertEqual(
        section.mesh.userData.usesParallelTransportFrames,
        true
      );
    });

    track.dispose();
  });

  harness.test("level one visual curve length stays close to canonical distance", () => {
    const track = createFirstLevelTrack();
    const tolerance = track.trackLength * 0.1;

    assertApproximately(track.curveLength, track.trackLength, tolerance);
    track.dispose();
  });

  harness.test("cached parallel-transport frames stay orthonormal", () => {
    const track = createFirstLevelTrack();
    const quarter = track.trackLength / 4;
    const sampleDistances = [
      track.startDistance,
      quarter,
      quarter * 2,
      quarter * 3,
      track.endDistance
    ];

    assertEqual(
      track.cachedFrameCount,
      GAME_CONFIG.vessel.frameSampleCount + 1
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
    const track = createFirstLevelTrack();
    const distance = track.trackLength * 0.4;
    const frame = track.getFrameAtDistance(distance);
    const worldPosition = track.getWorldPosition(distance, 2, -1);
    const expected = frame.point
      .clone()
      .addScaledVector(frame.right, 2)
      .addScaledVector(frame.up, -1);

    assertApproximately(worldPosition.distanceTo(expected), 0, 0.000001);
    track.dispose();
  });

  harness.test("section vertex colors follow configured arterial-venous gradients", () => {
    const track = createFirstLevelTrack();
    const descendingAorta = track.sections[2];
    const colorAttribute = descendingAorta.geometry.getAttribute("color");

    assert(colorAttribute !== undefined);
    assertEqual(
      colorAttribute.count,
      descendingAorta.geometry.getAttribute("position").count
    );
    assertAttributeColor(
      colorAttribute,
      0,
      LEVELS[0].sections[2].colorStart
    );
    assertAttributeColor(
      colorAttribute,
      colorAttribute.count - 1,
      LEVELS[0].sections[2].colorEnd
    );
    track.dispose();
  });

  harness.test("track samples the local vessel gradient for RBC reflection", () => {
    const track = createFirstLevelTrack();
    const section = track.sections[4];
    const midpoint =
      (section.startDistance + section.endDistance) / 2;
    const target = new Color();
    const sampled = track.getColorAtDistance(midpoint, target);
    const expected = new Color(section.colorStart).lerp(
      new Color(section.colorEnd),
      0.5
    );

    assertEqual(sampled, target);
    assertApproximately(sampled.r, expected.r, 0.000001);
    assertApproximately(sampled.g, expected.g, 0.000001);
    assertApproximately(sampled.b, expected.b, 0.000001);
    assertEqual(
      section.getColorAtDistance(section.startDistance).getHex(),
      new Color(section.colorStart).getHex()
    );
    assertEqual(
      section.getColorAtDistance(section.endDistance).getHex(),
      new Color(section.colorEnd).getHex()
    );
    track.dispose();
  });

  harness.test("flow texture advances only when the track is updated", () => {
    const track = createFirstLevelTrack();
    const initialOffset = track.flowTexture.offset.x;

    track.update(2);
    assertApproximately(
      track.flowTexture.offset.x,
      initialOffset - GAME_CONFIG.vessel.flowTexture.offsetSpeed * 2,
      Number.EPSILON
    );
    track.dispose();
    assertEqual(track.group.children.length, 0);
  });
}
