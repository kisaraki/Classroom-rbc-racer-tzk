import { GameClock } from "../../js/core/GameClock.js?v=stable-v1.1-20260715-r2";
import {
  assertApproximately,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerTimingTests(harness) {
  harness.test("GameClock creates absolute deadlines", () => {
    let nowMs = 1000;
    const clock = new GameClock({ nowProvider: () => nowMs });
    const deadlineMs = clock.deadlineAfterSeconds(5);

    assertEqual(deadlineMs, 6000);

    nowMs = 3500;
    assertApproximately(clock.remainingSeconds(deadlineMs), 2.5, 0);
    assertApproximately(clock.elapsedSeconds(1000), 2.5, 0);
    assertEqual(clock.hasExpired(deadlineMs), false);

    nowMs = 6000;
    assertEqual(clock.remainingMs(deadlineMs), 0);
    assertEqual(clock.hasExpired(deadlineMs), true);
  });

  harness.test("GameClock advances during a simulated pause", () => {
    let nowMs = 2000;
    const clock = new GameClock({ nowProvider: () => nowMs });
    const deadlineMs = clock.deadlineAfterMs(1500);

    nowMs = 4000;
    assertEqual(clock.hasExpired(deadlineMs), true);
    assertEqual(clock.remainingMs(deadlineMs), 0);
    assertEqual(clock.elapsedSeconds(2000), 2);
  });

  harness.test("GameClock elapsed time continues after a deadline", () => {
    let nowMs = 1000;
    const clock = new GameClock({ nowProvider: () => nowMs });
    const deadlineMs = clock.deadlineAfterSeconds(1);

    nowMs = 4500;
    assertEqual(clock.remainingSeconds(deadlineMs), 0);
    assertEqual(clock.elapsedSeconds(1000), 3.5);
  });

  harness.test("GameClock rejects negative durations", () => {
    const clock = new GameClock({ nowProvider: () => 0 });
    assertThrows(() => clock.deadlineAfterMs(-1), RangeError);
    assertThrows(() => clock.deadlineAfterSeconds(-1), RangeError);
  });
}
