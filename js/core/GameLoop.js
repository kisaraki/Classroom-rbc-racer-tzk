import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function assertFunction(value, label) {
  if (typeof value !== "function") {
    throw new TypeError(label + " must be a function.");
  }
}

export function getSimulationDeltaSeconds(
  rawDeltaSeconds,
  worldIsRunning,
  maximumDeltaSeconds =
    GAME_CONFIG.timing.maximumSimulationDeltaSeconds
) {
  if (!Number.isFinite(rawDeltaSeconds) || rawDeltaSeconds < 0) {
    throw new RangeError("rawDeltaSeconds must be finite and non-negative.");
  }

  if (!Number.isFinite(maximumDeltaSeconds) || maximumDeltaSeconds <= 0) {
    throw new RangeError("maximumDeltaSeconds must be positive.");
  }

  if (!worldIsRunning) {
    return 0;
  }

  return Math.min(rawDeltaSeconds, maximumDeltaSeconds);
}

export class GameLoop {
  #updateSimulation;
  #renderFrame;
  #isWorldRunning;
  #requestFrame;
  #cancelFrame;
  #frameRequestId = null;
  #previousTimestampMs = null;
  #running = false;

  constructor({
    updateSimulation,
    renderFrame,
    isWorldRunning,
    requestFrame = globalThis.requestAnimationFrame?.bind(globalThis),
    cancelFrame = globalThis.cancelAnimationFrame?.bind(globalThis)
  }) {
    assertFunction(updateSimulation, "updateSimulation");
    assertFunction(renderFrame, "renderFrame");
    assertFunction(isWorldRunning, "isWorldRunning");
    assertFunction(requestFrame, "requestFrame");
    assertFunction(cancelFrame, "cancelFrame");

    this.#updateSimulation = updateSimulation;
    this.#renderFrame = renderFrame;
    this.#isWorldRunning = isWorldRunning;
    this.#requestFrame = requestFrame;
    this.#cancelFrame = cancelFrame;
  }

  get isRunning() {
    return this.#running;
  }

  start() {
    if (this.#running) {
      return false;
    }

    this.#running = true;
    this.#previousTimestampMs = null;
    this.#frameRequestId = this.#requestFrame(this.#onFrame);
    return true;
  }

  stop() {
    if (!this.#running) {
      return false;
    }

    this.#running = false;

    if (this.#frameRequestId !== null) {
      this.#cancelFrame(this.#frameRequestId);
      this.#frameRequestId = null;
    }

    this.#previousTimestampMs = null;
    return true;
  }

  #onFrame = (timestampMs) => {
    if (!this.#running) {
      return;
    }

    const previousTimestampMs = this.#previousTimestampMs ?? timestampMs;
    const rawDeltaSeconds =
      (timestampMs - previousTimestampMs) /
      GAME_CONFIG.timing.millisecondsPerSecond;
    this.#previousTimestampMs = timestampMs;

    const simulationDeltaSeconds = getSimulationDeltaSeconds(
      rawDeltaSeconds,
      this.#isWorldRunning()
    );

    if (simulationDeltaSeconds > 0) {
      this.#updateSimulation(simulationDeltaSeconds, timestampMs);
    }

    this.#renderFrame(rawDeltaSeconds, timestampMs);
    this.#frameRequestId = this.#requestFrame(this.#onFrame);
  };
}
