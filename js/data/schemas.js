import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

export const GAS_EXCHANGE_STATUS = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
});

export const RBC_COLOR_STATES = Object.freeze({
  RED: "RED",
  RED_PURPLE: "RED_PURPLE"
});

export function toggleRbcColorState(colorState) {
  if (!Object.values(RBC_COLOR_STATES).includes(colorState)) {
    throw new RangeError("Unknown RBC color state: " + colorState);
  }

  return colorState === RBC_COLOR_STATES.RED
    ? RBC_COLOR_STATES.RED_PURPLE
    : RBC_COLOR_STATES.RED;
}

export const PLAYER_STATE_SCHEMA = Object.freeze({
  hp: "finite number",
  maxHp: "finite number",
  bp: "finite number",
  score: "finite number",
  alcoholCount: "non-negative integer",
  malariaCount: "non-negative integer",
  carbonMonoxideCount: "non-negative integer",
  currentLevel: "configured level id",
  distanceAlongTrack: "finite number",
  previousDistanceAlongTrack: "finite number",
  lateralX: "finite number",
  lateralY: "finite number",
  collisionRadius: "positive finite number",
  gasExchangeStatus: "GAS_EXCHANGE_STATUS",
  gasExchangeAttempts: "non-negative integer",
  woundDodgedCount: "non-negative integer",
  qteSuccessCount: "non-negative integer",
  rbcColorState: "RBC_COLOR_STATES"
});

export const ENTITY_STATE_SCHEMA = Object.freeze({
  id: "string",
  typeId: "configured entity type id",
  distanceAlongTrack: "finite number",
  previousDistanceAlongTrack: "finite number",
  lateralX: "finite number",
  lateralY: "finite number",
  collisionRadius: "positive finite number",
  consumed: "boolean"
});

export const LEVEL_DATA_SCHEMA = Object.freeze({
  id: "configured level id",
  name: "string",
  hudLabel: "string",
  circulationType: "string",
  targetDriveSeconds: "positive finite number",
  trackLength: "positive finite number",
  seed: "integer",
  controlPoints: "array of three-number arrays",
  minimapPathId: "string",
  transfer: "heart chamber endpoint pair",
  start: "route endpoint",
  end: "route endpoint",
  sections: "array",
  multipliers: "object",
  gasExchange: "tissue or lung opportunity data"
});

export const LEVEL_SECTION_SCHEMA = Object.freeze({
  id: "string",
  locationLabel: "string",
  startDistance: "finite number",
  endDistance: "finite number",
  startRatio: "normalized progress",
  endRatio: "normalized progress",
  radius: "positive finite number",
  colorStart: "string",
  colorEnd: "string",
  minimapSegmentId: "string",
  minimapStartProgress: "normalized progress",
  minimapEndProgress: "normalized progress"
});

export const LEVEL_CHECKPOINT_SCHEMA = Object.freeze({
  levelId: "configured level id",
  hp: "finite number",
  score: "finite number",
  seed: "integer",
  rbcColorState: "RBC_COLOR_STATES"
});

function isObject(value) {
  return value !== null && typeof value === "object";
}

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isConfiguredLevelId(levelId) {
  return Object.hasOwn(GAME_CONFIG.levels, levelId);
}

function isNormalizedProgress(value) {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

function isRouteEndpoint(value) {
  return (
    isObject(value) &&
    isFiniteNumber(value.distance) &&
    typeof value.locationLabel === "string"
  );
}

function isGasExchangeData(value, sections) {
  if (
    !isObject(value) ||
    !Object.hasOwn(
      GAME_CONFIG.qte.opportunityCountByRegion,
      value.region
    ) ||
    typeof value.sectionId !== "string" ||
    !Number.isInteger(value.opportunityCount) ||
    value.opportunityCount !==
      GAME_CONFIG.qte.opportunityCountByRegion[value.region] ||
    !Array.isArray(value.triggerDistances) ||
    value.triggerDistances.length !== value.opportunityCount
  ) {
    return false;
  }

  const exchangeSection = sections.find(
    (section) => section.id === value.sectionId
  );

  return (
    exchangeSection?.gasExchangeZone === value.region &&
    value.triggerDistances.every(
      (distance, index, distances) =>
        isFiniteNumber(distance) &&
        distance > exchangeSection.startDistance &&
        distance < exchangeSection.endDistance &&
        (index === 0 || distance > distances[index - 1])
    )
  );
}

export function isLevelSection(value) {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.locationLabel === "string" &&
    isFiniteNumber(value.startDistance) &&
    isFiniteNumber(value.endDistance) &&
    value.endDistance > value.startDistance &&
    isNormalizedProgress(value.startRatio) &&
    isNormalizedProgress(value.endRatio) &&
    value.endRatio > value.startRatio &&
    isFiniteNumber(value.radius) &&
    value.radius > 0 &&
    typeof value.colorStart === "string" &&
    typeof value.colorEnd === "string" &&
    typeof value.minimapSegmentId === "string" &&
    isNormalizedProgress(value.minimapStartProgress) &&
    isNormalizedProgress(value.minimapEndProgress) &&
    value.minimapEndProgress > value.minimapStartProgress
  );
}

export function isPlayerState(value) {
  return (
    isObject(value) &&
    isFiniteNumber(value.hp) &&
    isFiniteNumber(value.maxHp) &&
    isFiniteNumber(value.bp) &&
    isFiniteNumber(value.score) &&
    isNonNegativeInteger(value.alcoholCount) &&
    isNonNegativeInteger(value.malariaCount) &&
    isNonNegativeInteger(value.carbonMonoxideCount) &&
    isConfiguredLevelId(value.currentLevel) &&
    isFiniteNumber(value.distanceAlongTrack) &&
    isFiniteNumber(value.previousDistanceAlongTrack) &&
    isFiniteNumber(value.lateralX) &&
    isFiniteNumber(value.lateralY) &&
    isFiniteNumber(value.collisionRadius) &&
    value.collisionRadius > 0 &&
    Object.values(GAS_EXCHANGE_STATUS).includes(value.gasExchangeStatus) &&
    isNonNegativeInteger(value.gasExchangeAttempts) &&
    isNonNegativeInteger(value.woundDodgedCount) &&
    isNonNegativeInteger(value.qteSuccessCount) &&
    Object.values(RBC_COLOR_STATES).includes(value.rbcColorState)
  );
}

export function createPlayerState(overrides = {}) {
  const playerState = {
    hp: GAME_CONFIG.hp.initial,
    maxHp: GAME_CONFIG.hp.max,
    bp: GAME_CONFIG.bp.initial,
    score: GAME_CONFIG.score.initial,
    alcoholCount: 0,
    malariaCount: 0,
    carbonMonoxideCount: 0,
    currentLevel: GAME_CONFIG.game.initialLevelId,
    distanceAlongTrack: 0,
    previousDistanceAlongTrack: 0,
    lateralX: 0,
    lateralY: 0,
    collisionRadius: GAME_CONFIG.track.playerCollisionRadius,
    gasExchangeStatus: GAS_EXCHANGE_STATUS.PENDING,
    gasExchangeAttempts: 0,
    woundDodgedCount: 0,
    qteSuccessCount: 0,
    rbcColorState: RBC_COLOR_STATES.RED,
    ...overrides
  };

  if (!isPlayerState(playerState)) {
    throw new TypeError("Player state does not match PLAYER_STATE_SCHEMA.");
  }

  return playerState;
}

export function isEntityState(value) {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.typeId === "string" &&
    isFiniteNumber(value.distanceAlongTrack) &&
    isFiniteNumber(value.previousDistanceAlongTrack) &&
    isFiniteNumber(value.lateralX) &&
    isFiniteNumber(value.lateralY) &&
    isFiniteNumber(value.collisionRadius) &&
    value.collisionRadius > 0 &&
    typeof value.consumed === "boolean"
  );
}

export function createEntityState({
  id,
  typeId,
  distanceAlongTrack,
  previousDistanceAlongTrack = distanceAlongTrack,
  lateralX = 0,
  lateralY = 0,
  collisionRadius,
  consumed = false
}) {
  const entityState = {
    id,
    typeId,
    distanceAlongTrack,
    previousDistanceAlongTrack,
    lateralX,
    lateralY,
    collisionRadius,
    consumed
  };

  if (!isEntityState(entityState)) {
    throw new TypeError("Entity state does not match ENTITY_STATE_SCHEMA.");
  }

  return entityState;
}

export function isLevelData(value) {
  return (
    isObject(value) &&
    isConfiguredLevelId(value.id) &&
    typeof value.name === "string" &&
    typeof value.hudLabel === "string" &&
    typeof value.circulationType === "string" &&
    isFiniteNumber(value.targetDriveSeconds) &&
    value.targetDriveSeconds > 0 &&
    isFiniteNumber(value.trackLength) &&
    value.trackLength > 0 &&
    Number.isInteger(value.seed) &&
    Array.isArray(value.controlPoints) &&
    value.controlPoints.length >= 2 &&
    value.controlPoints.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 3 &&
        point.every(isFiniteNumber)
    ) &&
    typeof value.minimapPathId === "string" &&
    isObject(value.transfer) &&
    typeof value.transfer.fromChamber === "string" &&
    typeof value.transfer.toChamber === "string" &&
    isRouteEndpoint(value.start) &&
    value.start.distance === 0 &&
    isRouteEndpoint(value.end) &&
    value.end.distance === value.trackLength &&
    Array.isArray(value.sections) &&
    value.sections.length > 0 &&
    value.sections.every(isLevelSection) &&
    isObject(value.multipliers) &&
    isGasExchangeData(value.gasExchange, value.sections)
  );
}

export function isLevelCheckpoint(value) {
  return (
    isObject(value) &&
    isConfiguredLevelId(value.levelId) &&
    isFiniteNumber(value.hp) &&
    isFiniteNumber(value.score) &&
    Number.isInteger(value.seed) &&
    Object.values(RBC_COLOR_STATES).includes(value.rbcColorState)
  );
}

export function createLevelCheckpoint(playerState, seed) {
  if (!isPlayerState(playerState)) {
    throw new TypeError("Cannot checkpoint an invalid player state.");
  }

  const checkpoint = {
    levelId: playerState.currentLevel,
    hp: playerState.hp,
    score: playerState.score,
    seed,
    rbcColorState: playerState.rbcColorState
  };

  if (!isLevelCheckpoint(checkpoint)) {
    throw new TypeError(
      "Checkpoint does not match LEVEL_CHECKPOINT_SCHEMA."
    );
  }

  return checkpoint;
}
