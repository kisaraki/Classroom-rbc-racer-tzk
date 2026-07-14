import {
  GameLoop,
  getSimulationDeltaSeconds
} from "../../js/core/GameLoop.js";
import {
  GAME_STATES,
  GameStateMachine
} from "../../js/core/GameStateMachine.js";
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
