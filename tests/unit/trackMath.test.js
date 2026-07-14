import { GAME_CONFIG } from "../../js/config.js";
import {
  distanceToNormalizedProgress,
  normalizedProgressToDistance
} from "../../js/world/TrackMath.js";
import {
  assertApproximately,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerTrackMathTests(harness) {
  harness.test("distance converts to normalized progress", () => {
    const trackLength = GAME_CONFIG.levels[1].trackLength;
    const progress = distanceToNormalizedProgress(trackLength / 2, trackLength);
    assertApproximately(progress, 0.5, Number.EPSILON);
  });

  harness.test("distance conversion clamps to the track bounds", () => {
    const trackLength = GAME_CONFIG.levels[1].trackLength;
    assertEqual(distanceToNormalizedProgress(-1, trackLength), 0);
    assertEqual(
      distanceToNormalizedProgress(trackLength + 1, trackLength),
      1
    );
  });

  harness.test("normalized progress converts back to distance", () => {
    const trackLength = GAME_CONFIG.levels[3].trackLength;
    assertApproximately(
      normalizedProgressToDistance(0.25, trackLength),
      trackLength / 4,
      Number.EPSILON
    );
  });

  harness.test("distance conversion rejects an invalid track length", () => {
    assertThrows(
      () => distanceToNormalizedProgress(0, 0),
      RangeError
    );
  });
}
