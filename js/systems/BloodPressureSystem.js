import { GAME_CONFIG } from "../config.js";

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }
}

export function clampBloodPressure(bp, config = GAME_CONFIG) {
  assertFiniteNumber(bp, "bp");
  return Math.min(config.bp.max, Math.max(config.bp.min, bp));
}

export function updateBloodPressure(
  bp,
  adjustmentAxis,
  deltaSeconds,
  config = GAME_CONFIG
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
    config
  );
}

export function getSpeedForBloodPressure(bp, config = GAME_CONFIG) {
  const clampedBp = clampBloodPressure(bp, config);
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
