import { GameClock } from "./GameClock.js";
import {
  GAME_STATES,
  GameStateMachine
} from "./GameStateMachine.js";

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

  get deadlineMs() {
    return this.#deadlineMs;
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

    const deadlineMs = this.#clock.deadlineAfterSeconds(
      this.#durationSeconds
    );

    if (!this.#stateMachine.start()) {
      return false;
    }

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
}
