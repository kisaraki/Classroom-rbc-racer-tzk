import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function defaultNowProvider() {
  if (
    globalThis.performance &&
    typeof globalThis.performance.now === "function"
  ) {
    return globalThis.performance.now();
  }

  return Date.now();
}

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }
}

function assertDuration(value, label) {
  assertFiniteNumber(value, label);

  if (value < 0) {
    throw new RangeError(label + " cannot be negative.");
  }
}

export class GameClock {
  #nowProvider;

  constructor({ nowProvider = defaultNowProvider } = {}) {
    if (typeof nowProvider !== "function") {
      throw new TypeError("nowProvider must be a function.");
    }

    this.#nowProvider = nowProvider;
  }

  get nowMs() {
    const value = this.#nowProvider();
    assertFiniteNumber(value, "nowMs");
    return value;
  }

  deadlineAfterMs(durationMs, nowMs = this.nowMs) {
    assertDuration(durationMs, "durationMs");
    assertFiniteNumber(nowMs, "nowMs");
    return nowMs + durationMs;
  }

  deadlineAfterSeconds(durationSeconds, nowMs = this.nowMs) {
    assertDuration(durationSeconds, "durationSeconds");
    return this.deadlineAfterMs(
      durationSeconds * GAME_CONFIG.timing.millisecondsPerSecond,
      nowMs
    );
  }

  remainingMs(deadlineMs, nowMs = this.nowMs) {
    assertFiniteNumber(deadlineMs, "deadlineMs");
    assertFiniteNumber(nowMs, "nowMs");
    return Math.max(0, deadlineMs - nowMs);
  }

  remainingSeconds(deadlineMs, nowMs = this.nowMs) {
    return (
      this.remainingMs(deadlineMs, nowMs) /
      GAME_CONFIG.timing.millisecondsPerSecond
    );
  }

  elapsedMs(startedAtMs, nowMs = this.nowMs) {
    assertFiniteNumber(startedAtMs, "startedAtMs");
    assertFiniteNumber(nowMs, "nowMs");
    return Math.max(0, nowMs - startedAtMs);
  }

  elapsedSeconds(startedAtMs, nowMs = this.nowMs) {
    return (
      this.elapsedMs(startedAtMs, nowMs) /
      GAME_CONFIG.timing.millisecondsPerSecond
    );
  }

  hasExpired(deadlineMs, nowMs = this.nowMs) {
    assertFiniteNumber(deadlineMs, "deadlineMs");
    assertFiniteNumber(nowMs, "nowMs");
    return nowMs >= deadlineMs;
  }
}
