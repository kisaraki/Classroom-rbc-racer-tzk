export const GAME_STATES = Object.freeze({
  READY: "READY",
  PLAYING: "PLAYING",
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
    if (this.#state !== GAME_STATES.PLAYING) {
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
}
