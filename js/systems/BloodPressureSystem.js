import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }
}

function requireBloodPressureMaximum(maximum, config) {
  assertFiniteNumber(maximum, "bloodPressureMaximum");

  if (maximum < config.bp.min || maximum > config.bp.max) {
    throw new RangeError(
      "bloodPressureMaximum must remain inside configured BP bounds."
    );
  }

  return maximum;
}

export function clampBloodPressure(
  bp,
  config = GAME_CONFIG,
  maximum = config.bp.max
) {
  assertFiniteNumber(bp, "bp");
  return Math.min(
    requireBloodPressureMaximum(maximum, config),
    Math.max(config.bp.min, bp)
  );
}

export function updateBloodPressure(
  bp,
  adjustmentAxis,
  deltaSeconds,
  config = GAME_CONFIG,
  maximum = config.bp.max
) {
  assertFiniteNumber(bp, "bp");
  assertFiniteNumber(adjustmentAxis, "adjustmentAxis");
  assertFiniteNumber(deltaSeconds, "deltaSeconds");

  if (deltaSeconds < 0) {
    throw new RangeError("deltaSeconds cannot be negative.");
  }

  const normalizedAxis = Math.min(1, Math.max(-1, adjustmentAxis));
  return clampBloodPressure(
    bp + normalizedAxis * config.bp.changeRate * deltaSeconds,
    config,
    maximum
  );
}

export function getSpeedForBloodPressure(
  bp,
  config = GAME_CONFIG,
  maximum = config.bp.max
) {
  const clampedBp = clampBloodPressure(bp, config, maximum);
  const calculatedSpeed =
    config.movement.minSpeed +
    (clampedBp - config.movement.bpOffset) *
      config.movement.speedPerBp;

  return Math.min(
    config.movement.maxSpeed,
    Math.max(config.movement.minSpeed, calculatedSpeed)
  );
}

export function getWoundChancePerSecond(
  bp,
  levelId,
  config = GAME_CONFIG
) {
  if (!Number.isFinite(bp)) {
    throw new TypeError("bp must be a finite number.");
  }

  const level = config.levels[levelId];

  if (!level) {
    throw new RangeError("Unknown level id: " + levelId);
  }

  const baseChance =
    config.wound.baseChanceCoefficient *
    Math.exp(
      (bp - config.bp.safeMax) / config.wound.exponentialBpScale
    );

  if (level.highRisk && bp >= config.wound.highRiskFormulaMinBp) {
    const levelMultiplier =
      bp > config.bp.safeMax
        ? level.multipliers.wound
        : config.wound.safeRangeMultiplier;

    return Math.min(
      config.wound.maximumChancePerSecond,
      baseChance * levelMultiplier
    );
  }

  if (bp <= config.bp.safeMax) {
    return 0;
  }

  return Math.min(config.wound.maximumChancePerSecond, baseChance);
}

export function getLowBloodPressureChancePerSecond(
  bp,
  config = GAME_CONFIG
) {
  assertFiniteNumber(bp, "bp");

  if (bp >= config.bp.safeMin) {
    return 0;
  }

  return Math.min(
    config.lowBloodPressure.maximumChancePerSecond,
    (config.bp.safeMin - bp) *
      config.lowBloodPressure.chancePerBpPoint
  );
}

function assertTimestamp(value, label) {
  assertFiniteNumber(value, label);

  if (value < 0) {
    throw new RangeError(label + " cannot be negative.");
  }
}

function sampleRandom(random) {
  const value = typeof random === "function" ? random() : random.next();

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Random samples must be inside [0, 1).");
  }

  return value;
}

export class BloodPressureHazardSystem {
  #levelId;
  #random;
  #config;
  #nextCheckAtMs = null;
  #stasisExpiresAtMs = null;
  #cooldownExpiresAtMs = null;
  #checkCount = 0;
  #woundTriggerCount = 0;
  #lowBloodPressureTriggerCount = 0;
  #lastWoundChance = 0;
  #lastLowBloodPressureChance = 0;
  #lastRoll = null;

  constructor({ levelId, random = Math.random, config = GAME_CONFIG } = {}) {
    if (!config.levels[levelId]) {
      throw new RangeError("Unknown level id: " + levelId);
    }

    if (
      typeof random !== "function" &&
      typeof random?.next !== "function"
    ) {
      throw new TypeError("random must be a function or expose next().");
    }

    this.#levelId = levelId;
    this.#random = random;
    this.#config = config;
  }

  get nextCheckAtMs() {
    return this.#nextCheckAtMs;
  }

  get stasisExpiresAtMs() {
    return this.#stasisExpiresAtMs;
  }

  get cooldownExpiresAtMs() {
    return this.#cooldownExpiresAtMs;
  }

  get diagnostics() {
    return Object.freeze({
      checkCount: this.#checkCount,
      woundTriggerCount: this.#woundTriggerCount,
      lowBloodPressureTriggerCount:
        this.#lowBloodPressureTriggerCount,
      lastWoundChance: this.#lastWoundChance,
      lastLowBloodPressureChance:
        this.#lastLowBloodPressureChance,
      lastRoll: this.#lastRoll,
      nextCheckAtMs: this.#nextCheckAtMs,
      stasisExpiresAtMs: this.#stasisExpiresAtMs,
      cooldownExpiresAtMs: this.#cooldownExpiresAtMs
    });
  }

  isStasisActive(nowMs) {
    assertTimestamp(nowMs, "nowMs");
    return (
      this.#stasisExpiresAtMs !== null &&
      nowMs < this.#stasisExpiresAtMs
    );
  }

  isCooldownActive(nowMs) {
    assertTimestamp(nowMs, "nowMs");
    return (
      this.#stasisExpiresAtMs === null &&
      this.#cooldownExpiresAtMs !== null &&
      nowMs < this.#cooldownExpiresAtMs
    );
  }

  update({ bp, nowMs, isPlaying }) {
    assertFiniteNumber(bp, "bp");
    assertTimestamp(nowMs, "nowMs");

    if (typeof isPlaying !== "boolean") {
      throw new TypeError("isPlaying must be a boolean.");
    }

    const result = {
      checked: false,
      woundTriggered: false,
      lowBloodPressureTriggered: false,
      stasisExpired: false,
      woundChance: getWoundChancePerSecond(
        bp,
        this.#levelId,
        this.#config
      ),
      lowBloodPressureChance:
        getLowBloodPressureChancePerSecond(bp, this.#config),
      roll: null
    };

    this.#lastWoundChance = result.woundChance;
    this.#lastLowBloodPressureChance =
      result.lowBloodPressureChance;

    if (
      this.#stasisExpiresAtMs !== null &&
      nowMs >= this.#stasisExpiresAtMs
    ) {
      this.#stasisExpiresAtMs = null;
      result.stasisExpired = true;
    }

    if (
      this.#cooldownExpiresAtMs !== null &&
      nowMs >= this.#cooldownExpiresAtMs
    ) {
      this.#cooldownExpiresAtMs = null;
    }

    const checkIntervalMs =
      this.#config.bloodPressureHazards.checkIntervalSeconds *
      this.#config.timing.millisecondsPerSecond;

    if (!isPlaying) {
      this.#nextCheckAtMs = nowMs + checkIntervalMs;
      return Object.freeze(result);
    }

    if (this.#nextCheckAtMs === null) {
      this.#nextCheckAtMs = nowMs + checkIntervalMs;
      return Object.freeze(result);
    }

    if (nowMs < this.#nextCheckAtMs) {
      return Object.freeze(result);
    }

    this.#nextCheckAtMs = nowMs + checkIntervalMs;
    this.#checkCount += 1;
    result.checked = true;

    if (
      result.lowBloodPressureChance > 0 &&
      !this.isCooldownActive(nowMs)
    ) {
      result.roll = sampleRandom(this.#random);
      this.#lastRoll = result.roll;

      if (result.roll < result.lowBloodPressureChance) {
        const stasisDurationMs =
          this.#config.lowBloodPressure.durationSeconds *
          this.#config.timing.millisecondsPerSecond;
        const cooldownDurationMs =
          this.#config.lowBloodPressure.cooldownSeconds *
          this.#config.timing.millisecondsPerSecond;
        this.#stasisExpiresAtMs = nowMs + stasisDurationMs;
        this.#cooldownExpiresAtMs =
          this.#stasisExpiresAtMs + cooldownDurationMs;
        this.#lowBloodPressureTriggerCount += 1;
        result.lowBloodPressureTriggered = true;
      }

      return Object.freeze(result);
    }

    if (result.woundChance > 0) {
      result.roll = sampleRandom(this.#random);
      this.#lastRoll = result.roll;

      if (result.roll < result.woundChance) {
        this.#woundTriggerCount += 1;
        result.woundTriggered = true;
      }
    }

    return Object.freeze(result);
  }
}
