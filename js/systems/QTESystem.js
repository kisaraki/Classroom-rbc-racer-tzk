import { GAME_CONFIG } from "../config.js?v=phase07-status-r2";
import { GameClock } from "../core/GameClock.js?v=phase07-status-r2";
import { GAS_EXCHANGE_STATUS } from "../data/schemas.js?v=phase07-status-r2";

export const QTE_ACTIONS = Object.freeze({
  OXYGEN: "KeyO",
  CARBON_DIOXIDE: "KeyC"
});

export const QTE_PHASES = Object.freeze({
  IDLE: "IDLE",
  INPUT: "INPUT",
  RESULT: "RESULT"
});

export const QTE_EVENTS = Object.freeze({
  STARTED: "STARTED",
  INPUT: "INPUT",
  OUTCOME: "OUTCOME",
  RESULT_EXPIRED: "RESULT_EXPIRED"
});

export const QTE_OUTCOMES = Object.freeze({
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE"
});

export const QTE_TRIGGER_TYPES = Object.freeze({
  PRIMARY: "PRIMARY",
  RETRY: "RETRY",
  FALLBACK: "FALLBACK"
});

function assertTimestamp(value, label = "nowMs") {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }

  if (value < 0) {
    throw new RangeError(label + " cannot be negative.");
  }
}

function assertDistance(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }
}

function crossedDistance(previousDistance, currentDistance, targetDistance) {
  return (
    previousDistance <= targetDistance &&
    currentDistance >= targetDistance &&
    currentDistance > previousDistance
  );
}

export function canCompleteLevel(status) {
  if (!Object.values(GAS_EXCHANGE_STATUS).includes(status)) {
    throw new RangeError("Unknown gas exchange status: " + status);
  }

  return status !== GAS_EXCHANGE_STATUS.PENDING;
}

export class QTESystem {
  #level;
  #config;
  #clock;
  #phase = QTE_PHASES.IDLE;
  #status = GAS_EXCHANGE_STATUS.PENDING;
  #attempts = 0;
  #oxygenCount = 0;
  #carbonDioxideCount = 0;
  #qteExpiresAtMs = null;
  #resultExpiresAtMs = null;
  #activeTriggerType = null;
  #lastOutcome = null;

  constructor({
    level,
    config = GAME_CONFIG.qte,
    clock = new GameClock()
  } = {}) {
    if (
      !level?.gasTriggerDistances ||
      !Object.values(level.gasTriggerDistances).every(Number.isFinite)
    ) {
      throw new TypeError(
        "QTESystem requires configured gas trigger distances."
      );
    }

    if (
      !Number.isFinite(config.durationMs) ||
      config.durationMs <= 0 ||
      !Number.isFinite(config.resultDisplayMs) ||
      config.resultDisplayMs < 0 ||
      !Number.isInteger(config.oxygenThreshold) ||
      config.oxygenThreshold <= 0 ||
      !Number.isInteger(config.carbonDioxideThreshold) ||
      config.carbonDioxideThreshold <= 0 ||
      !Number.isInteger(config.maxAttempts) ||
      config.maxAttempts <= 0 ||
      !Number.isFinite(config.successScore) ||
      !Number.isFinite(config.failureScore)
    ) {
      throw new TypeError("QTESystem requires valid QTE configuration.");
    }

    this.#level = level;
    this.#config = config;
    this.#clock = clock;
  }

  get phase() {
    return this.#phase;
  }

  get status() {
    return this.#status;
  }

  get attempts() {
    return this.#attempts;
  }

  get qteExpiresAtMs() {
    return this.#qteExpiresAtMs;
  }

  get resultExpiresAtMs() {
    return this.#resultExpiresAtMs;
  }

  get nextTriggerType() {
    if (
      this.#phase !== QTE_PHASES.IDLE ||
      this.#status !== GAS_EXCHANGE_STATUS.PENDING ||
      this.#attempts >= this.#config.maxAttempts
    ) {
      return null;
    }

    return this.#attempts === 0
      ? QTE_TRIGGER_TYPES.PRIMARY
      : QTE_TRIGGER_TYPES.RETRY;
  }

  get nextTriggerDistance() {
    const triggerType = this.nextTriggerType;

    if (triggerType === QTE_TRIGGER_TYPES.PRIMARY) {
      return this.#level.gasTriggerDistances.primary;
    }

    if (triggerType === QTE_TRIGGER_TYPES.RETRY) {
      return this.#level.gasTriggerDistances.retry;
    }

    return null;
  }

  get diagnostics() {
    return Object.freeze({
      phase: this.#phase,
      status: this.#status,
      attempts: this.#attempts,
      oxygenCount: this.#oxygenCount,
      carbonDioxideCount: this.#carbonDioxideCount,
      oxygenThreshold: this.#config.oxygenThreshold,
      carbonDioxideThreshold: this.#config.carbonDioxideThreshold,
      qteExpiresAtMs: this.#qteExpiresAtMs,
      resultExpiresAtMs: this.#resultExpiresAtMs,
      activeTriggerType: this.#activeTriggerType,
      nextTriggerType: this.nextTriggerType,
      nextTriggerDistance: this.nextTriggerDistance,
      lastOutcome: this.#lastOutcome,
      canCompleteLevel: canCompleteLevel(this.#status)
    });
  }

  tryStart(
    previousDistance,
    currentDistance,
    nowMs,
    { atLevelEnd = false } = {}
  ) {
    assertDistance(previousDistance, "previousDistance");
    assertDistance(currentDistance, "currentDistance");
    assertTimestamp(nowMs);

    if (typeof atLevelEnd !== "boolean") {
      throw new TypeError("atLevelEnd must be a boolean.");
    }

    const expectedType = this.nextTriggerType;
    const expectedDistance = this.nextTriggerDistance;

    if (expectedType === null || expectedDistance === null) {
      return null;
    }

    const crossedExpected = crossedDistance(
      previousDistance,
      currentDistance,
      expectedDistance
    );
    const crossedFallback = crossedDistance(
      previousDistance,
      currentDistance,
      this.#level.gasTriggerDistances.fallback
    );

    if (!crossedExpected && !crossedFallback && !atLevelEnd) {
      return null;
    }

    this.#phase = QTE_PHASES.INPUT;
    this.#oxygenCount = 0;
    this.#carbonDioxideCount = 0;
    this.#resultExpiresAtMs = null;
    this.#lastOutcome = null;
    this.#activeTriggerType = crossedExpected
      ? expectedType
      : QTE_TRIGGER_TYPES.FALLBACK;
    this.#qteExpiresAtMs = this.#clock.deadlineAfterMs(
      this.#config.durationMs,
      nowMs
    );

    return Object.freeze({
      type: QTE_EVENTS.STARTED,
      triggerType: this.#activeTriggerType,
      expiresAtMs: this.#qteExpiresAtMs
    });
  }

  recordAction(action, nowMs) {
    if (!Object.values(QTE_ACTIONS).includes(action)) {
      throw new RangeError("Unknown QTE action: " + action);
    }

    assertTimestamp(nowMs);
    const deadlineEvent = this.update(nowMs);

    if (deadlineEvent || this.#phase !== QTE_PHASES.INPUT) {
      return deadlineEvent;
    }

    if (action === QTE_ACTIONS.OXYGEN) {
      this.#oxygenCount += 1;
    } else {
      this.#carbonDioxideCount += 1;
    }

    if (
      this.#oxygenCount >= this.#config.oxygenThreshold &&
      this.#carbonDioxideCount >= this.#config.carbonDioxideThreshold
    ) {
      return this.#finish(QTE_OUTCOMES.SUCCESS, nowMs);
    }

    return Object.freeze({
      type: QTE_EVENTS.INPUT,
      action,
      oxygenCount: this.#oxygenCount,
      carbonDioxideCount: this.#carbonDioxideCount
    });
  }

  update(nowMs) {
    assertTimestamp(nowMs);

    if (
      this.#phase === QTE_PHASES.INPUT &&
      nowMs >= this.#qteExpiresAtMs
    ) {
      return this.#finish(
        QTE_OUTCOMES.FAILURE,
        this.#qteExpiresAtMs
      );
    }

    if (
      this.#phase === QTE_PHASES.RESULT &&
      nowMs >= this.#resultExpiresAtMs
    ) {
      const outcome = this.#lastOutcome;
      this.#phase = QTE_PHASES.IDLE;
      this.#resultExpiresAtMs = null;
      this.#activeTriggerType = null;
      return Object.freeze({
        type: QTE_EVENTS.RESULT_EXPIRED,
        outcome,
        status: this.#status
      });
    }

    return null;
  }

  reset() {
    this.#phase = QTE_PHASES.IDLE;
    this.#status = GAS_EXCHANGE_STATUS.PENDING;
    this.#attempts = 0;
    this.#oxygenCount = 0;
    this.#carbonDioxideCount = 0;
    this.#qteExpiresAtMs = null;
    this.#resultExpiresAtMs = null;
    this.#activeTriggerType = null;
    this.#lastOutcome = null;
  }

  #finish(outcome, resultStartedAtMs) {
    this.#attempts += 1;
    this.#phase = QTE_PHASES.RESULT;
    this.#qteExpiresAtMs = null;
    this.#lastOutcome = outcome;
    this.#resultExpiresAtMs = this.#clock.deadlineAfterMs(
      this.#config.resultDisplayMs,
      resultStartedAtMs
    );

    if (outcome === QTE_OUTCOMES.SUCCESS) {
      this.#status = GAS_EXCHANGE_STATUS.SUCCESS;
    } else if (this.#attempts >= this.#config.maxAttempts) {
      this.#status = GAS_EXCHANGE_STATUS.FAILED;
    } else {
      this.#status = GAS_EXCHANGE_STATUS.PENDING;
    }

    return Object.freeze({
      type: QTE_EVENTS.OUTCOME,
      outcome,
      status: this.#status,
      attempts: this.#attempts,
      scoreDelta:
        outcome === QTE_OUTCOMES.SUCCESS
          ? this.#config.successScore
          : this.#config.failureScore,
      resultExpiresAtMs: this.#resultExpiresAtMs,
      retryAvailable: this.#status === GAS_EXCHANGE_STATUS.PENDING
    });
  }
}
