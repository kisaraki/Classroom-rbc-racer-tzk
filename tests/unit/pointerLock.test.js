import { GameClock } from "../../js/core/GameClock.js?v=stable-v1.1-20260715-r2";
import { GameSession } from "../../js/core/GameSession.js?v=stable-v1.1-20260715-r2";
import { GAME_STATES } from "../../js/core/GameStateMachine.js";
import { PointerLockController } from "../../js/input/PointerLockController.js?v=stable-v1.1-20260715-r2";
import {
  assertDeepEqual,
  assertEqual
} from "./TestHarness.js";

class FakeEventTarget {
  #listeners = new Map();

  addEventListener(type, listener) {
    const listeners = this.#listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.#listeners.get(type)?.delete(listener);
  }

  dispatch(type, event = { type }) {
    this.#listeners.get(type)?.forEach((listener) => listener(event));
  }
}

class FakePointerLockDocument extends FakeEventTarget {
  pointerLockElement = null;

  exitPointerLock() {
    this.pointerLockElement = null;
    this.dispatch("pointerlockchange");
  }
}

function createTarget(requestPointerLock) {
  return {
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    requestPointerLock
  };
}

export function registerPointerLockTests(harness) {
  harness.test(
    "Pointer Lock request starts the deadline while the world waits paused",
    () => {
      let nowMs = 1000;
      const session = new GameSession({
        durationSeconds: 30,
        clock: new GameClock({ nowProvider: () => nowMs })
      });

      assertEqual(session.prepareForPointerLock(), true);
      assertEqual(session.state, GAME_STATES.PAUSED);
      assertEqual(session.isWorldRunning, false);
      assertEqual(session.deadlineMs, 31000);
      assertEqual(session.nowMs, 1000);
      assertEqual(session.remainingSeconds, 30);
      assertEqual(session.elapsedSeconds, 0);

      nowMs = 6000;
      session.rejectPointerLock();
      assertEqual(session.nowMs, 6000);
      assertEqual(session.state, GAME_STATES.PAUSED);
      assertEqual(session.remainingSeconds, 25);
      assertEqual(session.elapsedSeconds, 5);
    }
  );

  harness.test(
    "successful Pointer Lock resumes and release pauses the world",
    () => {
      const session = new GameSession({ durationSeconds: 30 });

      session.prepareForPointerLock();
      assertEqual(session.acquirePointerLock(), true);
      assertEqual(session.state, GAME_STATES.PLAYING);
      assertEqual(session.isWorldRunning, true);
      assertEqual(session.releasePointerLock(), true);
      assertEqual(session.state, GAME_STATES.PAUSED);
      assertEqual(session.isWorldRunning, false);
    }
  );

  harness.test(
    "Pointer Lock controller reports capture and release events",
    async () => {
      const documentRef = new FakePointerLockDocument();
      const changes = [];
      let target;
      target = createTarget(() => {
        documentRef.pointerLockElement = target;
        documentRef.dispatch("pointerlockchange");
        return Promise.resolve();
      });
      const controller = new PointerLockController({
        documentRef,
        targetElement: target,
        onChange: (isLocked) => changes.push(isLocked)
      });

      assertEqual(controller.attach(), true);
      assertEqual(await controller.request(), true);
      assertEqual(target.focusCount, 1);
      assertEqual(controller.isLocked, true);
      assertEqual(controller.exit(), true);
      assertEqual(controller.isLocked, false);
      assertDeepEqual(changes, [true, false]);
      assertEqual(controller.detach(), true);
    }
  );

  harness.test(
    "Pointer Lock rejection is handled once and remains retryable",
    async () => {
      const documentRef = new FakePointerLockDocument();
      const errors = [];
      const denied = new Error("User activation is required.");
      denied.name = "NotAllowedError";
      const target = createTarget(() => Promise.reject(denied));
      const controller = new PointerLockController({
        documentRef,
        targetElement: target,
        onError: (error) => errors.push(error)
      });

      controller.attach();
      assertEqual(await controller.request(), false);
      documentRef.dispatch("pointerlockerror");
      assertEqual(errors.length, 1);
      assertEqual(errors[0], denied);

      assertEqual(await controller.request(), false);
      assertEqual(errors.length, 2);
      controller.detach();
    }
  );

  harness.test(
    "unsupported and silent Pointer Lock requests report typed errors",
    async () => {
      const documentRef = new FakePointerLockDocument();
      const errors = [];
      const target = createTarget(undefined);
      const controller = new PointerLockController({
        documentRef,
        targetElement: target,
        onError: (error) => errors.push(error)
      });

      assertEqual(await controller.request(), false);
      assertEqual(errors.length, 1);
      assertEqual(errors[0].name, "NotSupportedError");

      const silentErrors = [];
      const silentController = new PointerLockController({
        documentRef: new FakePointerLockDocument(),
        targetElement: createTarget(() => undefined),
        onError: (error) => silentErrors.push(error),
        requestTimeoutMs: 1200
      });

      assertEqual(await silentController.request(1000), true);
      assertEqual(silentController.isRequestPending, true);
      assertEqual(silentController.requestExpiresAtMs, 2200);
      assertEqual(silentController.update(2199), false);
      assertEqual(silentErrors.length, 0);
      assertEqual(silentController.update(2200), true);
      assertEqual(silentController.isRequestPending, false);
      assertEqual(silentErrors.length, 1);
      assertEqual(silentErrors[0].name, "TimeoutError");
      assertEqual(silentController.update(5000), false);
      assertEqual(silentErrors.length, 1);
    }
  );
}
