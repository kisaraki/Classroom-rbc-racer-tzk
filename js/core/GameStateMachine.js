export const GAME_STATES = Object.freeze({
  READY: "READY",
  PLAYING: "PLAYING",
  LOW_BP_STASIS: "LOW_BP_STASIS",
  PAUSED: "PAUSED"
});

export class GameStateMachine {
  #state = GAME_STATES.READY;
  #pausedFromState = null;

  get state() {
    return this.#state;
  }

  get pausedFromState() {
    return this.#pausedFromState;
  }

  get isWorldRunning() {
    return this.#state === GAME_STATES.PLAYING;
  }

  start() {
    if (this.#state !== GAME_STATES.READY) {
      return false;
    }

    this.#state = GAME_STATES.PLAYING;
    return true;
  }

  pause() {
    if (
      this.#state !== GAME_STATES.PLAYING &&
      this.#state !== GAME_STATES.LOW_BP_STASIS
    ) {
      return false;
    }

    this.#pausedFromState = this.#state;
    this.#state = GAME_STATES.PAUSED;
    return true;
  }

  resume() {
    if (this.#state !== GAME_STATES.PAUSED) {
      return false;
    }

    this.#state = this.#pausedFromState ?? GAME_STATES.PLAYING;
    this.#pausedFromState = null;
    return true;
  }

  enterLowBloodPressureStasis() {
    if (this.#state !== GAME_STATES.PLAYING) {
      return false;
    }

    this.#state = GAME_STATES.LOW_BP_STASIS;
    return true;
  }

  completeLowBloodPressureStasis() {
    if (this.#state === GAME_STATES.LOW_BP_STASIS) {
      this.#state = GAME_STATES.PLAYING;
      return true;
    }

    if (
      this.#state === GAME_STATES.PAUSED &&
      this.#pausedFromState === GAME_STATES.LOW_BP_STASIS
    ) {
      this.#pausedFromState = GAME_STATES.PLAYING;
      return true;
    }

    return false;
  }
}
