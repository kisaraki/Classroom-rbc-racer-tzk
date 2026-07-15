import { GAME_CONFIG } from "../config.js?v=phase10-final-r1";

export const INTOXICATION_EVENTS = Object.freeze({
  STARTED: "STARTED",
  UPDATED: "UPDATED",
  ENDED: "ENDED"
});

export const INTOXICATION_INPUT_CODES = Object.freeze([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyZ",
  "KeyX"
]);

const INTOXICATION_INPUT_CODE_SET = new Set(
  INTOXICATION_INPUT_CODES
);

function assertTimestamp(value, label = "nowMs") {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }

  if (value < 0) {
    throw new RangeError(label + " cannot be negative.");
  }
}

function assertAction(action) {
  if (
    !action ||
    !INTOXICATION_INPUT_CODE_SET.has(action.code) ||
    typeof action.pressed !== "boolean"
  ) {
    throw new TypeError(
      "Delayed input requires a driving code and pressed state."
    );
  }
}

function sampleRandom(random) {
  const value = typeof random === "function" ? random() : random.next();

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Random samples must be inside [0, 1).");
  }

  return value;
}

export function isIntoxicationActionAllowed(code, gameState) {
  if (!INTOXICATION_INPUT_CODE_SET.has(code)) {
    return false;
  }

  if (gameState === "PLAYING") {
    return true;
  }

  return gameState === "LOW_BP_STASIS" && code === "KeyZ";
}

export class StatusEffectManager {
  #config;
  #random;
  #intoxicated = false;
  #intoxicationStartedAtMs = null;
  #intoxicationExpiresAtMs = null;
  #nextBpRandomAtMs = null;
  #lastNowMs = 0;
  #lastRandomBp = null;
  #inputQueue = [];
  #activeCodes = new Set();
  #triggerCount = 0;
  #completionCount = 0;
  #queuedInputCount = 0;
  #failedInputCount = 0;
  #executedInputCount = 0;
  #droppedInputCount = 0;

  constructor({
    config = GAME_CONFIG,
    random = Math.random
  } = {}) {
    if (
      typeof random !== "function" &&
      typeof random?.next !== "function"
    ) {
      throw new TypeError("random must be a function or expose next().");
    }

    this.#config = config;
    this.#random = random;
  }

  get isIntoxicated() {
    return this.#intoxicated;
  }

  get intoxicationStartedAtMs() {
    return this.#intoxicationStartedAtMs;
  }

  get intoxicationExpiresAtMs() {
    return this.#intoxicationExpiresAtMs;
  }

  get inputQueueLength() {
    return this.#inputQueue.length;
  }

  get currentSway() {
    if (!this.#intoxicated) {
      return 0;
    }

    const elapsedSeconds =
      (this.#lastNowMs - this.#intoxicationStartedAtMs) /
      this.#config.timing.millisecondsPerSecond;
    return (
      Math.sin(
        elapsedSeconds * this.#config.intoxication.swayFrequency
      ) * this.#config.intoxication.swayAmplitude
    );
  }

  get diagnostics() {
    return Object.freeze({
      intoxicated: this.#intoxicated,
      intoxicationStartedAtMs: this.#intoxicationStartedAtMs,
      intoxicationExpiresAtMs: this.#intoxicationExpiresAtMs,
      nextBpRandomAtMs: this.#nextBpRandomAtMs,
      inputQueueLength: this.#inputQueue.length,
      activeCodes: Object.freeze([...this.#activeCodes].sort()),
      currentSway: this.currentSway,
      lastRandomBp: this.#lastRandomBp,
      triggerCount: this.#triggerCount,
      completionCount: this.#completionCount,
      queuedInputCount: this.#queuedInputCount,
      failedInputCount: this.#failedInputCount,
      executedInputCount: this.#executedInputCount,
      droppedInputCount: this.#droppedInputCount
    });
  }

  tryStart(alcoholCount, nowMs, pressedCodes = []) {
    if (!Number.isInteger(alcoholCount) || alcoholCount < 0) {
      throw new TypeError("alcoholCount must be a non-negative integer.");
    }

    assertTimestamp(nowMs);

    if (!Array.isArray(pressedCodes)) {
      throw new TypeError("pressedCodes must be an array.");
    }

    if (
      this.#intoxicated ||
      alcoholCount < this.#config.intoxication.triggerCount
    ) {
      return null;
    }

    pressedCodes.forEach((code) => {
      if (!INTOXICATION_INPUT_CODE_SET.has(code)) {
        throw new RangeError("Unknown intoxication input code: " + code);
      }
    });

    this.#intoxicated = true;
    this.#intoxicationStartedAtMs = nowMs;
    this.#intoxicationExpiresAtMs =
      nowMs +
      this.#config.intoxication.durationSeconds *
        this.#config.timing.millisecondsPerSecond;
    this.#nextBpRandomAtMs =
      nowMs + this.#config.intoxication.bpRandomIntervalMs;
    this.#lastNowMs = nowMs;
    this.#lastRandomBp = null;
    this.#inputQueue.length = 0;
    this.#activeCodes = new Set(pressedCodes);
    this.#triggerCount += 1;

    return Object.freeze({
      type: INTOXICATION_EVENTS.STARTED,
      expiresAtMs: this.#intoxicationExpiresAtMs
    });
  }

  queueInput(action, nowMs) {
    assertAction(action);
    assertTimestamp(nowMs);

    if (!this.#intoxicated) {
      return Object.freeze({ accepted: false, reason: "INACTIVE" });
    }

    const failureRoll = sampleRandom(this.#random);

    if (failureRoll < this.#config.intoxication.inputFailureChance) {
      this.#failedInputCount += 1;
      return Object.freeze({ accepted: false, reason: "FAILED" });
    }

    const delayRange =
      this.#config.intoxication.inputDelayMaxMs -
      this.#config.intoxication.inputDelayMinMs;
    const delayMs =
      this.#config.intoxication.inputDelayMinMs +
      sampleRandom(this.#random) * delayRange;
    const queuedAction = Object.freeze({
      action: Object.freeze({
        code: action.code,
        pressed: action.pressed
      }),
      executeAt: nowMs + delayMs
    });
    this.#inputQueue.push(queuedAction);
    this.#inputQueue.sort(
      (first, second) => first.executeAt - second.executeAt
    );
    this.#queuedInputCount += 1;
    return Object.freeze({
      accepted: true,
      reason: "QUEUED",
      executeAt: queuedAction.executeAt,
      delayMs
    });
  }

  update(nowMs, gameState) {
    assertTimestamp(nowMs);

    if (typeof gameState !== "string") {
      throw new TypeError("gameState must be a string.");
    }

    this.#lastNowMs = nowMs;

    if (!this.#intoxicated) {
      return Object.freeze({
        type: INTOXICATION_EVENTS.UPDATED,
        ended: false,
        bpOverride: null,
        executedActions: Object.freeze([]),
        droppedActions: Object.freeze([]),
        sway: 0
      });
    }

    if (nowMs >= this.#intoxicationExpiresAtMs) {
      const droppedActions = this.#inputQueue.map(
        (queued) => queued.action
      );
      this.#droppedInputCount += droppedActions.length;
      this.#finishIntoxication();
      this.#completionCount += 1;
      return Object.freeze({
        type: INTOXICATION_EVENTS.ENDED,
        ended: true,
        bpOverride: this.#config.bp.initial,
        executedActions: Object.freeze([]),
        droppedActions: Object.freeze(droppedActions),
        sway: 0
      });
    }

    const executedActions = [];
    const droppedActions = [];

    while (
      this.#inputQueue.length > 0 &&
      this.#inputQueue[0].executeAt <= nowMs
    ) {
      const queued = this.#inputQueue.shift();
      const { code, pressed } = queued.action;

      if (isIntoxicationActionAllowed(code, gameState)) {
        if (pressed) {
          this.#activeCodes.add(code);
        } else {
          this.#activeCodes.delete(code);
        }

        executedActions.push(queued.action);
        this.#executedInputCount += 1;
      } else {
        droppedActions.push(queued.action);
        this.#droppedInputCount += 1;
      }
    }

    let bpOverride = null;

    if (nowMs >= this.#nextBpRandomAtMs) {
      bpOverride =
        this.#config.bp.safeMin +
        sampleRandom(this.#random) *
          (this.#config.bp.safeMax - this.#config.bp.safeMin);
      this.#lastRandomBp = bpOverride;
      this.#nextBpRandomAtMs =
        nowMs + this.#config.intoxication.bpRandomIntervalMs;
    }

    return Object.freeze({
      type: INTOXICATION_EVENTS.UPDATED,
      ended: false,
      bpOverride,
      executedActions: Object.freeze(executedActions),
      droppedActions: Object.freeze(droppedActions),
      sway: this.currentSway
    });
  }

  getLateralAxes() {
    let x =
      Number(this.#activeCodes.has("ArrowRight")) -
      Number(this.#activeCodes.has("ArrowLeft")) +
      this.currentSway;
    let y =
      Number(this.#activeCodes.has("ArrowUp")) -
      Number(this.#activeCodes.has("ArrowDown"));
    const length = Math.hypot(x, y);

    if (length > 1) {
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  getBloodPressureAxis() {
    return (
      Number(this.#activeCodes.has("KeyZ")) -
      Number(this.#activeCodes.has("KeyX"))
    );
  }

  getBloodPressureRaiseAxis() {
    return Number(this.#activeCodes.has("KeyZ"));
  }

  releaseActiveControls() {
    const releasedCount = this.#activeCodes.size;
    this.#activeCodes.clear();
    return releasedCount;
  }

  reset() {
    this.#finishIntoxication();
    this.#lastNowMs = 0;
    this.#triggerCount = 0;
    this.#completionCount = 0;
    this.#queuedInputCount = 0;
    this.#failedInputCount = 0;
    this.#executedInputCount = 0;
    this.#droppedInputCount = 0;
  }

  #finishIntoxication() {
    this.#intoxicated = false;
    this.#intoxicationStartedAtMs = null;
    this.#intoxicationExpiresAtMs = null;
    this.#nextBpRandomAtMs = null;
    this.#lastRandomBp = null;
    this.#inputQueue.length = 0;
    this.#activeCodes.clear();
  }
}
