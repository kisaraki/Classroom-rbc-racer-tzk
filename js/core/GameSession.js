import { GameClock } from "./GameClock.js?v=phase01-real-clock";
import {
  GAME_STATES,
  GameStateMachine
} from "./GameStateMachine.js?v=phase10-final-r1";

function assertDurationSeconds(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError("durationSeconds must be a finite number.");
  }

  if (value < 0) {
    throw new RangeError("durationSeconds cannot be negative.");
  }
}

export class GameSession {
  #stateMachine;
  #clock;
  #durationSeconds;
  #startedAtMs = null;
  #deadlineMs = null;

  constructor({
    durationSeconds,
    clock = new GameClock(),
    stateMachine = new GameStateMachine()
  }) {
    assertDurationSeconds(durationSeconds);
    this.#durationSeconds = durationSeconds;
    this.#clock = clock;
    this.#stateMachine = stateMachine;
  }

  get state() {
    return this.#stateMachine.state;
  }

  get isWorldRunning() {
    return this.#stateMachine.isWorldRunning;
  }

  get pausedFromState() {
    return this.#stateMachine.pausedFromState;
  }

  get deadlineMs() {
    return this.#deadlineMs;
  }

  get nowMs() {
    return this.#clock.nowMs;
  }

  get elapsedSeconds() {
    return this.#startedAtMs === null
      ? null
      : this.#clock.elapsedSeconds(this.#startedAtMs);
  }

  get remainingSeconds() {
    return this.#deadlineMs === null
      ? null
      : this.#clock.remainingSeconds(this.#deadlineMs);
  }

  prepareForPointerLock() {
    if (this.state !== GAME_STATES.READY) {
      return false;
    }

    const startedAtMs = this.#clock.nowMs;
    const deadlineMs = this.#clock.deadlineAfterSeconds(
      this.#durationSeconds,
      startedAtMs
    );

    if (!this.#stateMachine.start()) {
      return false;
    }

    this.#startedAtMs = startedAtMs;
    this.#deadlineMs = deadlineMs;
    this.#stateMachine.pause();
    return true;
  }

  acquirePointerLock() {
    this.prepareForPointerLock();
    return this.#stateMachine.resume();
  }

  rejectPointerLock() {
    this.prepareForPointerLock();
    return this.#stateMachine.pause();
  }

  releasePointerLock() {
    return this.#stateMachine.pause();
  }

  enterLowBloodPressureStasis() {
    return this.#stateMachine.enterLowBloodPressureStasis();
  }

  completeLowBloodPressureStasis() {
    return this.#stateMachine.completeLowBloodPressureStasis();
  }

  enterQte() {
    return this.#stateMachine.enterQte();
  }

  completeQte() {
    return this.#stateMachine.completeQte();
  }

  enterTransferCutscene() {
    return this.#stateMachine.enterTransferCutscene();
  }

  completeTransferCutscene() {
    return this.#stateMachine.completeTransferCutscene();
  }

  enterVictory() {
    return this.#stateMachine.enterVictory();
  }

  enterGameOver(gameOverState) {
    return this.#stateMachine.enterGameOver(gameOverState);
  }
}
