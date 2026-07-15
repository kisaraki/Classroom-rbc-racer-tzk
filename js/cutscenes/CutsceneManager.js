import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

export const CUTSCENE_TYPES = Object.freeze({
  TRANSFER: "TRANSFER",
  RECYCLE: "RECYCLE",
  FALL: "FALL",
  STROKE: "STROKE",
  TIMEOUT: "TIMEOUT",
  VICTORY: "VICTORY"
});

function requireFiniteTime(nowMs) {
  if (!Number.isFinite(nowMs)) {
    throw new TypeError("Cutscene time must be finite.");
  }

  return nowMs;
}

function requireType(type, config) {
  if (!Object.values(CUTSCENE_TYPES).includes(type)) {
    throw new RangeError("Unknown cutscene type: " + type);
  }

  if (!config.durationsSeconds[type] || !config.timelines[type]) {
    throw new RangeError("Cutscene type has no configured timeline: " + type);
  }

  return type;
}

export class CutsceneManager {
  #config;
  #active = null;

  constructor({ config = GAME_CONFIG.cutscenes } = {}) {
    this.#config = config;
  }

  get isActive() {
    return this.#active !== null;
  }

  get type() {
    return this.#active?.type ?? null;
  }

  get diagnostics() {
    return this.#active === null
      ? Object.freeze({
          active: false,
          type: null,
          phase: null,
          progress: 0,
          startedAtMs: null,
          expiresAtMs: null,
          durationSeconds: null
        })
      : this.update(this.#active.lastUpdatedAtMs);
  }

  start(type, nowMs, context = {}) {
    requireType(type, this.#config);
    requireFiniteTime(nowMs);

    if (this.#active !== null) {
      throw new Error("A cutscene is already active.");
    }

    const durationSeconds = this.#config.durationsSeconds[type];
    const durationMs =
      durationSeconds * GAME_CONFIG.timing.millisecondsPerSecond;
    this.#active = {
      type,
      context: Object.freeze({ ...context }),
      startedAtMs: nowMs,
      expiresAtMs: nowMs + durationMs,
      durationSeconds,
      durationMs,
      lastUpdatedAtMs: nowMs
    };
    return this.update(nowMs);
  }

  update(nowMs) {
    requireFiniteTime(nowMs);

    if (this.#active === null) {
      return null;
    }

    this.#active.lastUpdatedAtMs = nowMs;
    const elapsedMs = Math.max(0, nowMs - this.#active.startedAtMs);
    const progress = Math.min(1, elapsedMs / this.#active.durationMs);
    const timeline = this.#config.timelines[this.#active.type];
    const phase =
      timeline.find((entry) => progress <= entry.endProgress)?.id ??
      timeline.at(-1).id;

    return Object.freeze({
      active: true,
      type: this.#active.type,
      phase,
      progress,
      completed: progress >= 1,
      startedAtMs: this.#active.startedAtMs,
      expiresAtMs: this.#active.expiresAtMs,
      durationSeconds: this.#active.durationSeconds,
      context: this.#active.context
    });
  }

  finish() {
    if (this.#active === null) {
      return false;
    }

    this.#active = null;
    return true;
  }

  reset() {
    this.#active = null;
  }
}
