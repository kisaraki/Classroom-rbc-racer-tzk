import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import {
  CUTSCENE_TYPES,
  CutsceneManager
} from "../../js/cutscenes/CutsceneManager.js?v=stable-v1.1-20260715-r2";
import {
  assertApproximately,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerCutsceneTests(harness) {
  harness.test("all STABLE cutscenes use configured absolute durations", () => {
    Object.values(CUTSCENE_TYPES).forEach((type) => {
      const manager = new CutsceneManager();
      const snapshot = manager.start(type, 1250, { levelId: 1 });
      const durationSeconds = GAME_CONFIG.cutscenes.durationsSeconds[type];

      assertEqual(snapshot.type, type);
      assertEqual(snapshot.startedAtMs, 1250);
      assertEqual(
        snapshot.expiresAtMs,
        1250 +
          durationSeconds * GAME_CONFIG.timing.millisecondsPerSecond
      );
      assertEqual(snapshot.completed, false);
    });
  });

  harness.test("transfer advances through chamber and conveyor phases", () => {
    const manager = new CutsceneManager();
    manager.start(CUTSCENE_TYPES.TRANSFER, 1000, {
      fromChamber: "右心房",
      toChamber: "右心室"
    });

    const entry = manager.update(1800);
    const conveyor = manager.update(1801);
    const arrival = manager.update(4200);

    assertApproximately(entry.progress, 0.2, Number.EPSILON);
    assertEqual(entry.phase, "CHAMBER_ENTRY");
    assertEqual(conveyor.phase, "CONVEYOR");
    assertEqual(arrival.phase, "CHAMBER_ARRIVAL");
    assertEqual(arrival.context.toChamber, "右心室");
  });

  harness.test("cutscene deadline completes after a paused-time jump", () => {
    const manager = new CutsceneManager();
    const started = manager.start(CUTSCENE_TYPES.FALL, 5000);
    const completed = manager.update(started.expiresAtMs + 3000);

    assertEqual(completed.progress, 1);
    assertEqual(completed.completed, true);
    assertEqual(completed.phase, "ABYSS");
  });

  harness.test("timeout cutscene ends at hepatic recycling", () => {
    const manager = new CutsceneManager();
    const started = manager.start(CUTSCENE_TYPES.TIMEOUT, 1000);
    const completed = manager.update(started.expiresAtMs);

    assertEqual(completed.phase, "HEPATIC_RECYCLE");
    assertEqual(completed.completed, true);
  });

  harness.test("cutscene finish and reset clear transient state", () => {
    const manager = new CutsceneManager();
    manager.start(CUTSCENE_TYPES.RECYCLE, 0);
    assertEqual(manager.finish(), true);
    assertEqual(manager.finish(), false);
    assertEqual(manager.diagnostics.active, false);

    manager.start(CUTSCENE_TYPES.VICTORY, 100);
    manager.reset();
    assertEqual(manager.type, null);
    assertEqual(manager.update(200), null);
  });

  harness.test("cutscene manager rejects invalid and overlapping starts", () => {
    const manager = new CutsceneManager();
    assertThrows(() => manager.start("UNKNOWN", 0), RangeError);
    assertThrows(
      () => manager.start(CUTSCENE_TYPES.TRANSFER, Number.NaN),
      TypeError
    );

    manager.start(CUTSCENE_TYPES.STROKE, 0);
    assertThrows(
      () => manager.start(CUTSCENE_TYPES.FALL, 1),
      Error
    );
  });
}
