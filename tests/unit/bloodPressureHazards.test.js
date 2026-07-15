import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import {
  BloodPressureHazardSystem,
  getLowBloodPressureChancePerSecond,
  getWoundChancePerSecond
} from "../../js/systems/BloodPressureSystem.js?v=stable-v1.1-20260715-r2";
import {
  assert,
  assertApproximately,
  assertEqual
} from "./TestHarness.js";

class SequenceRandom {
  #values;
  #index = 0;

  constructor(values) {
    this.#values = values;
  }

  next() {
    const value = this.#values[Math.min(
      this.#index,
      this.#values.length - 1
    )];
    this.#index += 1;
    return value;
  }
}

function createHazards({ levelId = 1, samples = [0.999999] } = {}) {
  return new BloodPressureHazardSystem({
    levelId,
    random: new SequenceRandom(samples)
  });
}

export function registerBloodPressureHazardTests(harness) {
  harness.test("low-BP probability follows the configured boundary table", () => {
    assertEqual(getLowBloodPressureChancePerSecond(80), 0);
    assertApproximately(
      getLowBloodPressureChancePerSecond(79),
      0.025,
      Number.EPSILON
    );
    assertApproximately(
      getLowBloodPressureChancePerSecond(75),
      0.125,
      Number.EPSILON
    );
    assertApproximately(
      getLowBloodPressureChancePerSecond(70),
      0.25,
      Number.EPSILON
    );
    assertEqual(
      getLowBloodPressureChancePerSecond(66),
      GAME_CONFIG.lowBloodPressure.maximumChancePerSecond
    );
  });

  harness.test("level four routes BP below 80 to low-BP handling only", () => {
    assertEqual(getWoundChancePerSecond(79, 4), 0);
    assert(
      getLowBloodPressureChancePerSecond(79) > 0,
      "BP 79 must remain eligible for low-BP stasis."
    );
  });

  harness.test("hazard rolls occur once per second instead of every frame", () => {
    const hazards = createHazards();

    assertEqual(
      hazards.update({ bp: 180, nowMs: 0, isPlaying: true }).checked,
      false
    );
    assertEqual(
      hazards.update({ bp: 180, nowMs: 999, isPlaying: true }).checked,
      false
    );
    assertEqual(
      hazards.update({ bp: 180, nowMs: 1000, isPlaying: true }).checked,
      true
    );
    assertEqual(
      hazards.update({ bp: 180, nowMs: 1001, isPlaying: true }).checked,
      false
    );
    assertEqual(hazards.diagnostics.checkCount, 1);
  });

  harness.test("paused time never backfills missed world hazard rolls", () => {
    const hazards = createHazards();
    hazards.update({ bp: 180, nowMs: 0, isPlaying: true });
    hazards.update({ bp: 180, nowMs: 5000, isPlaying: false });

    assertEqual(
      hazards.update({ bp: 180, nowMs: 5999, isPlaying: true }).checked,
      false
    );
    assertEqual(
      hazards.update({ bp: 180, nowMs: 6000, isPlaying: true }).checked,
      true
    );
    assertEqual(hazards.diagnostics.checkCount, 1);
  });

  harness.test("a successful high-BP roll requests one Wound", () => {
    const hazards = createHazards({ samples: [0] });
    hazards.update({ bp: 180, nowMs: 0, isPlaying: true });
    const result = hazards.update({
      bp: 180,
      nowMs: 1000,
      isPlaying: true
    });

    assertEqual(result.checked, true);
    assertEqual(result.woundTriggered, true);
    assertEqual(result.lowBloodPressureTriggered, false);
    assertEqual(hazards.diagnostics.woundTriggerCount, 1);
  });

  harness.test("level four scheduler applies safe-BP and high-BP contracts", () => {
    const safeHazards = createHazards({
      levelId: 4,
      samples: [
        GAME_CONFIG.wound.baseChanceCoefficient / 2
      ]
    });
    safeHazards.update({ bp: 130, nowMs: 0, isPlaying: true });
    const safeResult = safeHazards.update({
      bp: 130,
      nowMs: 1000,
      isPlaying: true
    });
    assertEqual(safeResult.woundTriggered, true);

    const standardChance = getWoundChancePerSecond(131, 1);
    const highRiskChance = getWoundChancePerSecond(131, 4);
    const separatingRoll = (standardChance + highRiskChance) / 2;
    const standardHazards = createHazards({
      levelId: 1,
      samples: [separatingRoll]
    });
    const highRiskHazards = createHazards({
      levelId: 4,
      samples: [separatingRoll]
    });
    standardHazards.update({ bp: 131, nowMs: 0, isPlaying: true });
    highRiskHazards.update({ bp: 131, nowMs: 0, isPlaying: true });

    assertEqual(
      standardHazards.update({
        bp: 131,
        nowMs: 1000,
        isPlaying: true
      }).woundTriggered,
      false
    );
    assertEqual(
      highRiskHazards.update({
        bp: 131,
        nowMs: 1000,
        isPlaying: true
      }).woundTriggered,
      true
    );
  });

  harness.test("low-BP trigger creates absolute stasis and cooldown deadlines", () => {
    const hazards = createHazards({ samples: [0] });
    hazards.update({ bp: 70, nowMs: 0, isPlaying: true });
    const triggered = hazards.update({
      bp: 70,
      nowMs: 1000,
      isPlaying: true
    });

    assertEqual(triggered.lowBloodPressureTriggered, true);
    assertEqual(hazards.stasisExpiresAtMs, 6000);
    assertEqual(hazards.cooldownExpiresAtMs, 16000);
    assertEqual(hazards.isStasisActive(5999), true);

    const expired = hazards.update({
      bp: 70,
      nowMs: 6000,
      isPlaying: false
    });
    assertEqual(expired.stasisExpired, true);
    assertEqual(hazards.isStasisActive(6000), false);
    assertEqual(hazards.isCooldownActive(6000), true);

    hazards.update({ bp: 70, nowMs: 16000, isPlaying: false });
    assertEqual(hazards.isCooldownActive(16000), false);
    assertEqual(hazards.cooldownExpiresAtMs, null);
  });

  harness.test("low-BP cooldown blocks retriggering until its deadline", () => {
    const hazards = createHazards({ samples: [0, 0] });
    hazards.update({ bp: 70, nowMs: 0, isPlaying: true });
    hazards.update({ bp: 70, nowMs: 1000, isPlaying: true });
    hazards.update({ bp: 70, nowMs: 6000, isPlaying: false });

    const blocked = hazards.update({
      bp: 70,
      nowMs: 7000,
      isPlaying: true
    });
    assertEqual(blocked.checked, true);
    assertEqual(blocked.lowBloodPressureTriggered, false);
    assertEqual(blocked.roll, null);

    hazards.update({ bp: 70, nowMs: 16000, isPlaying: false });
    const retriggered = hazards.update({
      bp: 70,
      nowMs: 17000,
      isPlaying: true
    });
    assertEqual(retriggered.lowBloodPressureTriggered, true);
    assertEqual(
      hazards.diagnostics.lowBloodPressureTriggerCount,
      2
    );
  });

}
