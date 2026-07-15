import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import { GameClock } from "../core/GameClock.js?v=stable-v1.1-20260715-r2";
import { GAS_EXCHANGE_STATUS } from "../data/schemas.js?v=stable-v1.1-20260715-r2";

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
  OPPORTUNITY: "OPPORTUNITY"
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
  #activeOpportunityIndex = null;
  #lastOutcome = null;
  #oxygenThreshold;
  #carbonDioxideThreshold;
  #carbonMonoxidePoisoned = false;

  constructor({
    level,
    config = GAME_CONFIG.qte,
    clock = new GameClock()
  } = {}) {
    const gasExchange = level?.gasExchange;
    const exchangeSection = level?.sections?.find(
      (section) => section.id === gasExchange?.sectionId
    );

    if (
      !gasExchange ||
      !Object.hasOwn(
        config?.opportunityCountByRegion ?? {},
        gasExchange.region
      ) ||
      !Number.isInteger(gasExchange.opportunityCount) ||
      gasExchange.opportunityCount <= 0 ||
      gasExchange.opportunityCount !==
        config.opportunityCountByRegion[gasExchange.region] ||
      !Array.isArray(gasExchange.triggerDistances) ||
      gasExchange.triggerDistances.length !== gasExchange.opportunityCount ||
      exchangeSection?.gasExchangeZone !== gasExchange.region ||
      !gasExchange.triggerDistances.every(
        (distance, index, distances) =>
          Number.isFinite(distance) &&
          distance > exchangeSection.startDistance &&
          distance < exchangeSection.endDistance &&
          (index === 0 || distance > distances[index - 1])
      )
    ) {
      throw new TypeError(
        "QTESystem requires configured tissue or lung opportunities."
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
      !Number.isInteger(config.carbonMonoxidePoisoningThreshold) ||
      config.carbonMonoxidePoisoningThreshold <=
        Math.max(config.oxygenThreshold, config.carbonDioxideThreshold) ||
      !Number.isFinite(config.successScore) ||
      !Number.isFinite(config.failureScore)
    ) {
      throw new TypeError("QTESystem requires valid QTE configuration.");
    }

    this.#level = level;
    this.#config = config;
    this.#clock = clock;
    this.#oxygenThreshold = config.oxygenThreshold;
    this.#carbonDioxideThreshold = config.carbonDioxideThreshold;
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

  get opportunityCount() {
    return this.#level.gasExchange.opportunityCount;
  }

  get qteExpiresAtMs() {
    return this.#qteExpiresAtMs;
  }

  get resultExpiresAtMs() {
    return this.#resultExpiresAtMs;
  }

  get nextOpportunityIndex() {
    if (
      this.#phase !== QTE_PHASES.IDLE ||
      this.#status !== GAS_EXCHANGE_STATUS.PENDING ||
      this.#attempts >= this.opportunityCount
    ) {
      return null;
    }

    return this.#attempts;
  }

  get nextTriggerType() {
    return this.nextOpportunityIndex === null
      ? null
      : QTE_TRIGGER_TYPES.OPPORTUNITY;
  }

  get nextTriggerDistance() {
    const index = this.nextOpportunityIndex;
    return index === null
      ? null
      : this.#level.gasExchange.triggerDistances[index];
  }

  get diagnostics() {
    const nextOpportunityIndex = this.nextOpportunityIndex;

    return Object.freeze({
      phase: this.#phase,
      status: this.#status,
      attempts: this.#attempts,
      opportunityCount: this.opportunityCount,
      remainingOpportunities: Math.max(
        0,
        this.opportunityCount - this.#attempts
      ),
      exchangeRegion: this.#level.gasExchange.region,
      activeOpportunityNumber:
        this.#activeOpportunityIndex === null
          ? null
          : this.#activeOpportunityIndex + 1,
      nextOpportunityNumber:
        nextOpportunityIndex === null ? null : nextOpportunityIndex + 1,
      oxygenCount: this.#oxygenCount,
      carbonDioxideCount: this.#carbonDioxideCount,
      oxygenThreshold: this.#oxygenThreshold,
      carbonDioxideThreshold: this.#carbonDioxideThreshold,
      carbonMonoxidePoisoned: this.#carbonMonoxidePoisoned,
      qteExpiresAtMs: this.#qteExpiresAtMs,
      resultExpiresAtMs: this.#resultExpiresAtMs,
      activeTriggerType:
        this.#activeOpportunityIndex === null
          ? null
          : QTE_TRIGGER_TYPES.OPPORTUNITY,
      nextTriggerType: this.nextTriggerType,
      nextTriggerDistance: this.nextTriggerDistance,
      lastOutcome: this.#lastOutcome,
      canCompleteLevel: canCompleteLevel(this.#status)
    });
  }

  tryStart(previousDistance, currentDistance, nowMs) {
    assertDistance(previousDistance, "previousDistance");
    assertDistance(currentDistance, "currentDistance");
    assertTimestamp(nowMs);

    const opportunityIndex = this.nextOpportunityIndex;
    const targetDistance = this.nextTriggerDistance;

    if (
      opportunityIndex === null ||
      targetDistance === null ||
      !crossedDistance(previousDistance, currentDistance, targetDistance)
    ) {
      return null;
    }

    this.#phase = QTE_PHASES.INPUT;
    this.#oxygenCount = 0;
    this.#carbonDioxideCount = 0;
    this.#resultExpiresAtMs = null;
    this.#lastOutcome = null;
    this.#activeOpportunityIndex = opportunityIndex;
    this.#qteExpiresAtMs = this.#clock.deadlineAfterMs(
      this.#config.durationMs,
      nowMs
    );

    return Object.freeze({
      type: QTE_EVENTS.STARTED,
      triggerType: QTE_TRIGGER_TYPES.OPPORTUNITY,
      opportunityNumber: opportunityIndex + 1,
      opportunityCount: this.opportunityCount,
      exchangeRegion: this.#level.gasExchange.region,
      expiresAtMs: this.#qteExpiresAtMs
    });
  }

  setCarbonMonoxidePoisoned(active) {
    if (typeof active !== "boolean") {
      throw new TypeError("CO poisoning mode requires a boolean.");
    }

    this.#carbonMonoxidePoisoned = active;
    const threshold = active
      ? this.#config.carbonMonoxidePoisoningThreshold
      : null;
    this.#oxygenThreshold = threshold ?? this.#config.oxygenThreshold;
    this.#carbonDioxideThreshold =
      threshold ?? this.#config.carbonDioxideThreshold;
    return this.#oxygenThreshold;
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
      this.#oxygenCount >= this.#oxygenThreshold &&
      this.#carbonDioxideCount >= this.#carbonDioxideThreshold
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
      this.#activeOpportunityIndex = null;
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
    this.#activeOpportunityIndex = null;
    this.#lastOutcome = null;
    this.setCarbonMonoxidePoisoned(false);
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
    } else if (this.#attempts >= this.opportunityCount) {
      this.#status = GAS_EXCHANGE_STATUS.FAILED;
    } else {
      this.#status = GAS_EXCHANGE_STATUS.PENDING;
    }

    return Object.freeze({
      type: QTE_EVENTS.OUTCOME,
      outcome,
      status: this.#status,
      attempts: this.#attempts,
      opportunityNumber: this.#attempts,
      opportunityCount: this.opportunityCount,
      scoreDelta:
        outcome === QTE_OUTCOMES.SUCCESS
          ? this.#config.successScore
          : this.#config.failureScore,
      resultExpiresAtMs: this.#resultExpiresAtMs,
      retryAvailable: this.#status === GAS_EXCHANGE_STATUS.PENDING
    });
  }
}
