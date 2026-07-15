import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { PlayerRBC } from "../../js/player/PlayerRBC.js?v=stable-v1.1-20260715-r2";
import {
  INTOXICATION_EVENTS,
  isIntoxicationActionAllowed,
  STATUS_EFFECT_EVENTS,
  StatusEffectManager
} from "../../js/systems/StatusEffectManager.js?v=stable-v1.1-20260715-r2";
import {
  assertApproximately,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

function createSequenceRandom(values) {
  let index = 0;

  return () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
}

export function registerStatusEffectTests(harness) {
  harness.test("intoxication starts on the fifth alcohol hit only", () => {
    const manager = new StatusEffectManager({ random: () => 0.5 });

    assertEqual(manager.tryStart(4, 1000), null);
    const event = manager.tryStart(5, 1000, ["ArrowRight"]);
    assertEqual(event.type, INTOXICATION_EVENTS.STARTED);
    assertEqual(event.expiresAtMs, 16000);
    assertEqual(manager.isIntoxicated, true);
    assertEqual(manager.diagnostics.activeCodes[0], "ArrowRight");

    assertEqual(manager.tryStart(6, 3000), null);
    assertEqual(manager.intoxicationExpiresAtMs, 16000);
    assertEqual(manager.diagnostics.triggerCount, 1);
  });

  harness.test("delayed input uses absolute executeAt and can fail", () => {
    const manager = new StatusEffectManager({
      random: createSequenceRandom([0.9, 0, 0.2])
    });
    manager.tryStart(5, 1000);

    const queued = manager.queueInput({
      code: "ArrowRight",
      pressed: true
    }, 1000);
    assertEqual(queued.accepted, true);
    assertEqual(queued.delayMs, GAME_CONFIG.intoxication.inputDelayMinMs);
    assertEqual(queued.executeAt, 1250);
    assertEqual(manager.update(1249, "PLAYING").executedActions.length, 0);
    assertEqual(manager.update(1250, "PLAYING").executedActions.length, 1);
    assertEqual(
      manager.diagnostics.activeCodes.includes("ArrowRight"),
      true
    );

    const failed = manager.queueInput({
      code: "ArrowLeft",
      pressed: true
    }, 1300);
    assertEqual(failed.accepted, false);
    assertEqual(failed.reason, "FAILED");
    assertEqual(manager.diagnostics.failedInputCount, 1);
  });

  harness.test("expired actions obey each main state's accepted controls", () => {
    const manager = new StatusEffectManager({
      random: createSequenceRandom([
        0.9, 0,
        0.9, 0,
        0.9, 0,
        0.5
      ])
    });
    manager.tryStart(5, 1000);
    manager.queueInput({ code: "ArrowUp", pressed: true }, 1000);
    manager.queueInput({ code: "KeyZ", pressed: true }, 1000);

    const stasis = manager.update(1250, "LOW_BP_STASIS");
    assertEqual(stasis.executedActions.length, 1);
    assertEqual(stasis.executedActions[0].code, "KeyZ");
    assertEqual(stasis.droppedActions[0].code, "ArrowUp");
    assertEqual(manager.getBloodPressureRaiseAxis(), 1);

    manager.queueInput({ code: "KeyX", pressed: true }, 1250);
    const paused = manager.update(1500, "PAUSED");
    assertEqual(paused.executedActions.length, 0);
    assertEqual(paused.droppedActions[0].code, "KeyX");
    assertEqual(isIntoxicationActionAllowed("KeyZ", "PLAYING"), true);
    assertEqual(
      isIntoxicationActionAllowed("KeyZ", "LOW_BP_STASIS"),
      true
    );
    assertEqual(
      isIntoxicationActionAllowed("ArrowUp", "LOW_BP_STASIS"),
      false
    );
    assertEqual(isIntoxicationActionAllowed("KeyO", "QTE"), false);
  });

  harness.test("intoxication randomizes BP once per 400ms update without catch-up", () => {
    const manager = new StatusEffectManager({
      random: createSequenceRandom([0, 0.999])
    });
    manager.tryStart(5, 1000);

    assertEqual(manager.update(1399, "PLAYING").bpOverride, null);
    const first = manager.update(1400, "PLAYING");
    assertEqual(first.bpOverride, GAME_CONFIG.bp.safeMin);
    assertEqual(manager.diagnostics.nextBpRandomAtMs, 1800);

    const lateFrame = manager.update(5000, "PAUSED");
    assertApproximately(lateFrame.bpOverride, 129.95, 0.000001);
    assertEqual(manager.diagnostics.nextBpRandomAtMs, 5400);
  });

  harness.test("S sway follows the configured absolute-time formula", () => {
    const manager = new StatusEffectManager({ random: () => 0.5 });
    manager.tryStart(5, 1000);
    manager.update(2000, "PLAYING");

    const expected =
      Math.sin(GAME_CONFIG.intoxication.swayFrequency) *
      GAME_CONFIG.intoxication.swayAmplitude;
    assertApproximately(manager.currentSway, expected, 0.000001);
    assertApproximately(manager.getLateralAxes().x, expected, 0.000001);
  });

  harness.test("intoxication expires during QTE and clears pending input", () => {
    const manager = new StatusEffectManager({
      random: createSequenceRandom([0.9, 0.999])
    });
    manager.tryStart(5, 1000);
    manager.queueInput({ code: "ArrowLeft", pressed: true }, 15000);

    const result = manager.update(16000, "QTE");
    assertEqual(result.type, INTOXICATION_EVENTS.ENDED);
    assertEqual(result.ended, true);
    assertEqual(result.bpOverride, GAME_CONFIG.bp.initial);
    assertEqual(result.droppedActions.length, 1);
    assertEqual(manager.isIntoxicated, false);
    assertEqual(manager.inputQueueLength, 0);
    assertEqual(manager.getBloodPressureAxis(), 0);
    assertEqual(manager.diagnostics.completionCount, 1);
  });

  harness.test("overlapping alcohol and malaria deadlines cross every frozen state", () => {
    const manager = new StatusEffectManager({ random: () => 0.5 });
    const player = new PlayerRBC();
    const hood = player.hoodController;
    manager.tryStart(5, 1000);
    hood.triggerBasicObstruction(1000);
    hood.setCombinedEffectMode(true);

    hood.setQteMode(true);
    manager.update(5000, "QTE");
    hood.update(5000);
    assertEqual(manager.isIntoxicated, true);
    assertEqual(hood.isBasicObstructionActive, true);
    assertEqual(hood.group.visible, false);

    manager.update(6000, "LOW_BP_STASIS");
    hood.update(6000);
    assertEqual(manager.isIntoxicated, true);
    assertEqual(hood.isBasicObstructionActive, false);
    assertEqual(hood.isRestoring, true);

    hood.setQteMode(false);
    manager.update(6400, "PAUSED");
    hood.update(6400);
    assertEqual(hood.isRestoring, false);
    assertEqual(hood.group.visible, true);

    const ended = manager.update(16000, "TRANSFER_CUTSCENE");
    assertEqual(ended.ended, true);
    assertEqual(manager.isIntoxicated, false);
    player.dispose();
  });

  harness.test("status-effect reset clears all transient diagnostics", () => {
    const manager = new StatusEffectManager({ random: () => 0.5 });
    manager.tryStart(5, 1000, ["KeyX"]);
    assertEqual(manager.releaseActiveControls(), 1);
    manager.reset();

    assertEqual(manager.isIntoxicated, false);
    assertEqual(manager.diagnostics.triggerCount, 0);
    assertEqual(manager.diagnostics.completionCount, 0);
    assertEqual(manager.currentSway, 0);
  });

  harness.test("every fifth malaria collision starts a 15-second blood rupture", () => {
    const manager = new StatusEffectManager({ random: () => 0.5 });

    assertEqual(manager.tryStartBloodRupture(4, 1000), null);
    const first = manager.tryStartBloodRupture(5, 1000);
    assertEqual(first.type, STATUS_EFFECT_EVENTS.BLOOD_RUPTURE_STARTED);
    assertEqual(first.expiresAtMs, 16000);
    assertEqual(manager.isBloodRuptureActive, true);
    assertEqual(manager.tryStartBloodRupture(9, 2000), null);
    const second = manager.tryStartBloodRupture(10, 3000);
    assertEqual(second.expiresAtMs, 18000);
    assertEqual(manager.update(17999, "PAUSED").bloodRuptureEnded, false);
    assertEqual(manager.update(18000, "QTE").bloodRuptureEnded, true);
    assertEqual(manager.isBloodRuptureActive, false);
  });

  harness.test("the tenth CO collision persists as poisoning until reset", () => {
    const manager = new StatusEffectManager({ random: () => 0.5 });

    assertEqual(manager.tryStartCarbonMonoxidePoisoning(9), null);
    const event = manager.tryStartCarbonMonoxidePoisoning(10);
    assertEqual(
      event.type,
      STATUS_EFFECT_EVENTS.CARBON_MONOXIDE_POISONING_STARTED
    );
    assertEqual(manager.isCarbonMonoxidePoisoned, true);
    assertEqual(manager.tryStartCarbonMonoxidePoisoning(15), null);
    manager.update(999999, "PAUSED");
    assertEqual(manager.isCarbonMonoxidePoisoned, true);
    manager.reset();
    assertEqual(manager.isCarbonMonoxidePoisoned, false);
  });

  harness.test("status effects reject invalid time, input, and random samples", () => {
    const manager = new StatusEffectManager({ random: () => 1 });
    assertThrows(() => manager.tryStart(-1, 0), TypeError);
    assertThrows(() => manager.tryStart(5, -1), RangeError);
    manager.tryStart(5, 0);
    assertThrows(
      () => manager.queueInput({ code: "KeyO", pressed: true }, 0),
      TypeError
    );
    assertThrows(
      () => manager.queueInput({ code: "KeyZ", pressed: true }, 0),
      RangeError
    );
  });
}
