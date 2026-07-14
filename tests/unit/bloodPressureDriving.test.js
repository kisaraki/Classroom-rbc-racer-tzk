import { GAME_CONFIG } from "../../js/config.js";
import {
  getSpeedForBloodPressure,
  updateBloodPressure
} from "../../js/systems/BloodPressureSystem.js";
import {
  assertApproximately,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerBloodPressureDrivingTests(harness) {
  harness.test("BP maps to the six specified driving speeds", () => {
    const expectedSpeeds = new Map([
      [50, 5],
      [80, 8],
      [100, 10],
      [130, 13],
      [150, 15],
      [180, 18]
    ]);

    expectedSpeeds.forEach((expectedSpeed, bp) => {
      assertApproximately(
        getSpeedForBloodPressure(bp),
        expectedSpeed,
        Number.EPSILON
      );
    });
  });

  harness.test("Z and X axes change BP at the configured rate", () => {
    assertApproximately(
      updateBloodPressure(GAME_CONFIG.bp.initial, 1, 0.5),
      GAME_CONFIG.bp.initial + GAME_CONFIG.bp.changeRate * 0.5,
      Number.EPSILON
    );
    assertApproximately(
      updateBloodPressure(GAME_CONFIG.bp.initial, -1, 0.5),
      GAME_CONFIG.bp.initial - GAME_CONFIG.bp.changeRate * 0.5,
      Number.EPSILON
    );
  });

  harness.test("BP adjustment clamps to configured bounds", () => {
    assertEqual(updateBloodPressure(GAME_CONFIG.bp.max, 1, 10), 180);
    assertEqual(updateBloodPressure(GAME_CONFIG.bp.min, -1, 10), 50);
  });

  harness.test("driving BP functions reject invalid time", () => {
    assertThrows(
      () => updateBloodPressure(GAME_CONFIG.bp.initial, 1, -1),
      RangeError
    );
    assertThrows(
      () => getSpeedForBloodPressure(Number.NaN),
      TypeError
    );
  });
}
