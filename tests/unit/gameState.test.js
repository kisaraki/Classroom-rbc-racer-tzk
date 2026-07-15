import {
  GameLoop,
  getSimulationDeltaSeconds
} from "../../js/core/GameLoop.js?v=stable-v1.1-20260715-r2";
import {
  GAME_STATES,
  GameStateMachine
} from "../../js/core/GameStateMachine.js?v=stable-v1.1-20260715-r2";
import { GameClock } from "../../js/core/GameClock.js?v=stable-v1.1-20260715-r2";
import { GameSession } from "../../js/core/GameSession.js?v=stable-v1.1-20260715-r2";
import {
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerGameStateTests(harness) {
  harness.test("state machine pauses and resumes the playing state", () => {
    const stateMachine = new GameStateMachine();
    assertEqual(stateMachine.state, GAME_STATES.READY);
    assertEqual(stateMachine.isWorldRunning, false);
    assertEqual(stateMachine.start(), true);
    assertEqual(stateMachine.isWorldRunning, true);
    assertEqual(stateMachine.pause(), true);
    assertEqual(stateMachine.state, GAME_STATES.PAUSED);
    assertEqual(stateMachine.pausedFromState, GAME_STATES.PLAYING);
    assertEqual(stateMachine.isWorldRunning, false);
    assertEqual(stateMachine.resume(), true);
    assertEqual(stateMachine.state, GAME_STATES.PLAYING);
  });

  harness.test("paused worlds receive zero simulation delta", () => {
    assertEqual(getSimulationDeltaSeconds(0.08, false), 0);
    assertEqual(getSimulationDeltaSeconds(2, true), 0.1);
    assertThrows(
      () => getSimulationDeltaSeconds(-0.01, true),
      RangeError
    );
  });

  harness.test("low-BP stasis freezes the world and returns to play", () => {
    const stateMachine = new GameStateMachine();
    stateMachine.start();

    assertEqual(stateMachine.enterLowBloodPressureStasis(), true);
    assertEqual(stateMachine.state, GAME_STATES.LOW_BP_STASIS);
    assertEqual(stateMachine.isWorldRunning, false);
    assertEqual(
      stateMachine.completeLowBloodPressureStasis(),
      true
    );
    assertEqual(stateMachine.state, GAME_STATES.PLAYING);
    assertEqual(stateMachine.isWorldRunning, true);
  });

  harness.test("stasis expiry while paused updates the resume target", () => {
    const stateMachine = new GameStateMachine();
    stateMachine.start();
    stateMachine.enterLowBloodPressureStasis();

    assertEqual(stateMachine.pause(), true);
    assertEqual(stateMachine.state, GAME_STATES.PAUSED);
    assertEqual(
      stateMachine.pausedFromState,
      GAME_STATES.LOW_BP_STASIS
    );
    assertEqual(
      stateMachine.completeLowBloodPressureStasis(),
      true
    );
    assertEqual(stateMachine.state, GAME_STATES.PAUSED);
    assertEqual(
      stateMachine.pausedFromState,
      GAME_STATES.PLAYING
    );
    assertEqual(stateMachine.resume(), true);
    assertEqual(stateMachine.state, GAME_STATES.PLAYING);
  });

  harness.test("QTE freezes the world and safely expires while paused", () => {
    const stateMachine = new GameStateMachine();
    stateMachine.start();
    assertEqual(stateMachine.enterQte(), true);
    assertEqual(stateMachine.state, GAME_STATES.QTE);
    assertEqual(stateMachine.isWorldRunning, false);
    stateMachine.pause();
    assertEqual(stateMachine.completeQte(), true);
    assertEqual(stateMachine.state, GAME_STATES.PAUSED);
    assertEqual(stateMachine.pausedFromState, GAME_STATES.PLAYING);
  });

  harness.test("transfer reaches LEVEL_COMPLETE when its deadline expires paused", () => {
    const stateMachine = new GameStateMachine();
    stateMachine.start();
    assertEqual(stateMachine.enterTransferCutscene(), true);
    stateMachine.pause();
    assertEqual(stateMachine.completeTransferCutscene(), true);
    assertEqual(stateMachine.state, GAME_STATES.LEVEL_COMPLETE);
    assertEqual(stateMachine.pausedFromState, null);
  });

  harness.test("first-level terminal failures stop simulation", () => {
    const woundState = new GameStateMachine();
    woundState.start();
    assertEqual(
      woundState.enterGameOver(GAME_STATES.GAME_OVER_FALL),
      true
    );
    assertEqual(woundState.isWorldRunning, false);

    const depletedState = new GameStateMachine();
    depletedState.start();
    assertEqual(
      depletedState.enterGameOver(GAME_STATES.GAME_OVER_RECYCLE),
      true
    );
    assertEqual(depletedState.isWorldRunning, false);
  });

  harness.test("brain Wound enters the dedicated Stroke terminal state", () => {
    const stateMachine = new GameStateMachine();
    stateMachine.start();

    assertEqual(
      stateMachine.enterGameOver(GAME_STATES.GAME_OVER_STROKE),
      true
    );
    assertEqual(stateMachine.state, GAME_STATES.GAME_OVER_STROKE);
    assertEqual(stateMachine.isWorldRunning, false);
  });

  harness.test("timeout ends play, QTE, stasis, and paused attempts", () => {
    ["PLAYING", "QTE", "LOW_BP_STASIS", "PAUSED"].forEach((mode) => {
      const stateMachine = new GameStateMachine();
      stateMachine.start();

      if (mode === "QTE") {
        stateMachine.enterQte();
      } else if (mode === "LOW_BP_STASIS" || mode === "PAUSED") {
        stateMachine.enterLowBloodPressureStasis();
      }
      if (mode === "PAUSED") {
        stateMachine.pause();
      }

      assertEqual(stateMachine.enterTimeoutGameOver(), true);
      assertEqual(stateMachine.state, GAME_STATES.GAME_OVER_TIMEOUT);
      assertEqual(stateMachine.pausedFromState, null);
    });
  });

  harness.test("GameSession deadline exposes timeout without pausing the clock", () => {
    let nowMs = 1000;
    const session = new GameSession({
      durationSeconds: 5,
      clock: new GameClock({ nowProvider: () => nowMs })
    });

    session.prepareForPointerLock();
    assertEqual(session.hasTimedOut, false);
    nowMs = 6000;
    assertEqual(session.hasTimedOut, true);
    assertEqual(session.enterTimeoutGameOver(), true);
    assertEqual(session.state, GAME_STATES.GAME_OVER_TIMEOUT);
  });

  harness.test("deadline-bound movement keeps only the pre-timeout frame slice", () => {
    let nowMs = 1000;
    const session = new GameSession({
      durationSeconds: 5,
      clock: new GameClock({ nowProvider: () => nowMs })
    });
    session.prepareForPointerLock();

    assertEqual(session.getDeadlineBoundDeltaSeconds(0.02, 5990), 0.02);
    assertEqual(session.getDeadlineBoundDeltaSeconds(0.02, 6000), 0.02);
    assertEqual(
      session.getDeadlineBoundDeltaSeconds(0.02, 6010).toFixed(3),
      "0.010"
    );
    assertEqual(session.getDeadlineBoundDeltaSeconds(0.02, 6030), 0);
    assertThrows(
      () => session.getDeadlineBoundDeltaSeconds(-0.01, 6000),
      RangeError
    );
  });

  harness.test("victory is accepted only after the final transfer completes", () => {
    const stateMachine = new GameStateMachine();
    assertEqual(stateMachine.enterVictory(), false);
    stateMachine.start();
    stateMachine.enterTransferCutscene();
    stateMachine.completeTransferCutscene();

    assertEqual(stateMachine.enterVictory(), true);
    assertEqual(stateMachine.state, GAME_STATES.VICTORY);
    assertEqual(stateMachine.isWorldRunning, false);
  });

  harness.test("GameLoop renders while paused without world updates", () => {
    const pendingFrames = [];
    let worldIsRunning = true;
    let updateCount = 0;
    let renderCount = 0;
    let cancelledFrameId = null;
    const loop = new GameLoop({
      updateSimulation: () => {
        updateCount += 1;
      },
      renderFrame: () => {
        renderCount += 1;
      },
      isWorldRunning: () => worldIsRunning,
      requestFrame: (callback) => {
        pendingFrames.push(callback);
        return pendingFrames.length;
      },
      cancelFrame: (frameId) => {
        cancelledFrameId = frameId;
      }
    });

    loop.start();
    pendingFrames.shift()(1000);
    pendingFrames.shift()(1050);
    assertEqual(updateCount, 1);
    assertEqual(renderCount, 2);

    worldIsRunning = false;
    pendingFrames.shift()(1100);
    assertEqual(updateCount, 1);
    assertEqual(renderCount, 3);
    assertEqual(loop.stop(), true);
    assertEqual(cancelledFrameId !== null, true);
  });
}
