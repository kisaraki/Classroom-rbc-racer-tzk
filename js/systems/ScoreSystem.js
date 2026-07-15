import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import { isPlayerState } from "../data/schemas.js?v=stable-v1.1-20260715-r2";

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getFiniteDelta(value, fieldName) {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    throw new TypeError(fieldName + " must be a finite number.");
  }

  return value;
}

export function applyEntityScoreEffect(
  playerState,
  entityType,
  config = GAME_CONFIG
) {
  if (!isPlayerState(playerState)) {
    throw new TypeError("A valid player state is required.");
  }

  if (!entityType || typeof entityType.id !== "string" || !entityType.tuning) {
    throw new TypeError("A configured entity type is required.");
  }

  const debuffMultiplier =
    entityType.category === "DEBUFF"
      ? config.penalties.debuffMultiplier
      : 1;
  const requestedScoreDelta = getFiniteDelta(
    entityType.tuning.scoreDelta,
    "scoreDelta"
  ) * debuffMultiplier;
  const requestedHpDelta = getFiniteDelta(
    entityType.tuning.hpDelta,
    "hpDelta"
  ) * debuffMultiplier;
  const previousScore = playerState.score;
  const previousHp = playerState.hp;

  playerState.score += requestedScoreDelta;
  playerState.hp = clamp(
    playerState.hp + requestedHpDelta,
    config.hp.min,
    playerState.maxHp
  );

  return Object.freeze({
    typeId: entityType.id,
    requestedScoreDelta,
    requestedHpDelta,
    scoreDelta: playerState.score - previousScore,
    hpDelta: playerState.hp - previousHp,
    score: playerState.score,
    hp: playerState.hp
  });
}

export class ScoreSystem {
  constructor({ config = GAME_CONFIG } = {}) {
    this.config = config;
  }

  apply(playerState, entityType) {
    return applyEntityScoreEffect(playerState, entityType, this.config);
  }
}
