export const GAME_STATES = Object.freeze({
  READY: "READY",
  PLAYING: "PLAYING",
  QTE: "QTE",
  LOW_BP_STASIS: "LOW_BP_STASIS",
  PAUSED: "PAUSED",
  TRANSFER_CUTSCENE: "TRANSFER_CUTSCENE",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER_RECYCLE: "GAME_OVER_RECYCLE",
  GAME_OVER_FALL: "GAME_OVER_FALL",
  GAME_OVER_STROKE: "GAME_OVER_STROKE",
  GAME_OVER_TIMEOUT: "GAME_OVER_TIMEOUT",
  VICTORY: "VICTORY"
});

const PAUSABLE_STATES = new Set([
  GAME_STATES.PLAYING,
  GAME_STATES.QTE,
  GAME_STATES.LOW_BP_STASIS,
  GAME_STATES.TRANSFER_CUTSCENE
]);

const GAME_OVER_STATES = new Set([
  GAME_STATES.GAME_OVER_RECYCLE,
  GAME_STATES.GAME_OVER_FALL,
  GAME_STATES.GAME_OVER_STROKE,
  GAME_STATES.GAME_OVER_TIMEOUT
]);

const TIMEOUT_ELIGIBLE_STATES = new Set([
  GAME_STATES.PLAYING,
  GAME_STATES.QTE,
  GAME_STATES.LOW_BP_STASIS
]);

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
    if (!PAUSABLE_STATES.has(this.#state)) {
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

  enterQte() {
    if (this.#state !== GAME_STATES.PLAYING) {
      return false;
    }

    this.#state = GAME_STATES.QTE;
    return true;
  }

  completeQte() {
    if (this.#state === GAME_STATES.QTE) {
      this.#state = GAME_STATES.PLAYING;
      return true;
    }

    if (
      this.#state === GAME_STATES.PAUSED &&
      this.#pausedFromState === GAME_STATES.QTE
    ) {
      this.#pausedFromState = GAME_STATES.PLAYING;
      return true;
    }

    return false;
  }

  enterTransferCutscene() {
    if (this.#state !== GAME_STATES.PLAYING) {
      return false;
    }

    this.#state = GAME_STATES.TRANSFER_CUTSCENE;
    return true;
  }

  completeTransferCutscene() {
    if (this.#state === GAME_STATES.TRANSFER_CUTSCENE) {
      this.#state = GAME_STATES.LEVEL_COMPLETE;
      return true;
    }

    if (
      this.#state === GAME_STATES.PAUSED &&
      this.#pausedFromState === GAME_STATES.TRANSFER_CUTSCENE
    ) {
      this.#state = GAME_STATES.LEVEL_COMPLETE;
      this.#pausedFromState = null;
      return true;
    }

    return false;
  }

  enterVictory() {
    if (this.#state !== GAME_STATES.LEVEL_COMPLETE) {
      return false;
    }

    this.#state = GAME_STATES.VICTORY;
    return true;
  }

  enterGameOver(gameOverState) {
    if (
      this.#state !== GAME_STATES.PLAYING ||
      !GAME_OVER_STATES.has(gameOverState)
    ) {
      return false;
    }

    this.#state = gameOverState;
    return true;
  }

  enterTimeoutGameOver() {
    const effectiveState = this.#state === GAME_STATES.PAUSED
      ? this.#pausedFromState
      : this.#state;

    if (!TIMEOUT_ELIGIBLE_STATES.has(effectiveState)) {
      return false;
    }

    this.#state = GAME_STATES.GAME_OVER_TIMEOUT;
    this.#pausedFromState = null;
    return true;
  }
}
