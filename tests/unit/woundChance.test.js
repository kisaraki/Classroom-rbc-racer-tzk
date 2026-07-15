import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { getWoundChancePerSecond } from "../../js/systems/BloodPressureSystem.js?v=stable-v1.1-20260715-r2";
import {
  assertApproximately,
  assertEqual
} from "./TestHarness.js";

export function registerWoundChanceTests(harness) {
  harness.test("normal levels suppress Wound at safe BP", () => {
    assertEqual(getWoundChancePerSecond(130, 1), 0);
  });

  harness.test("high-risk level keeps base Wound chance at BP 130", () => {
    assertApproximately(
      getWoundChancePerSecond(130, 4),
      0.005,
      Number.EPSILON
    );
  });

  harness.test("high-risk safe-BP Wound uses the exponential formula", () => {
    assertApproximately(
      getWoundChancePerSecond(100, 4),
      0.0006766764161830634,
      Number.EPSILON
    );
  });

  harness.test("high-risk BP above 130 applies the level multiplier", () => {
    const standardChance = getWoundChancePerSecond(131, 1);
    const highRiskChance = getWoundChancePerSecond(131, 4);

    assertApproximately(
      highRiskChance,
      standardChance * GAME_CONFIG.levels[4].multipliers.wound,
      Number.EPSILON
    );
  });

  harness.test("Wound chance respects the configured cap", () => {
    const highRiskMultiplier =
      GAME_CONFIG.levels[4].multipliers.wound;
    const firstBpAboveCap =
      GAME_CONFIG.bp.safeMax +
      GAME_CONFIG.wound.exponentialBpScale *
        Math.log(
          GAME_CONFIG.wound.maximumChancePerSecond /
            (GAME_CONFIG.wound.baseChanceCoefficient * highRiskMultiplier)
        ) +
      1;

    assertEqual(
      getWoundChancePerSecond(firstBpAboveCap, 4),
      GAME_CONFIG.wound.maximumChancePerSecond
    );
  });
}
