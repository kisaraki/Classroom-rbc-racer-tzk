import { Group } from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import {
  ENTITY_CATEGORIES,
  ENTITY_TYPES,
  GENERAL_SPAWN_TYPE_IDS,
  getEntityType
} from "../data/entityTypes.js?v=stable-v1.1-20260715-r2";
import {
  createEntityState,
  isPlayerState
} from "../data/schemas.js?v=stable-v1.1-20260715-r2";
import { SeededRandom } from "../utils/SeededRandom.js";
import { ProceduralAssetFactory } from "../world/ProceduralAssetFactory.js?v=stable-v1.1-20260715-r2";

function requireUnitValue(value) {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Weighted selection requires a value from 0 to below 1.");
  }

  return value;
}

function getWeightMultiplier(typeDefinition, multipliers) {
  if (!typeDefinition) {
    return 1;
  }

  const categoryMultiplier =
    typeDefinition.category === ENTITY_CATEGORIES.BUFF
      ? multipliers.buff
      : multipliers.debuff;
  const typeMultiplier = typeDefinition.weightMultiplierKey
    ? multipliers[typeDefinition.weightMultiplierKey]
    : 1;

  return categoryMultiplier * typeMultiplier;
}

export function buildEntityWeightTable(
  level,
  typeIds = GENERAL_SPAWN_TYPE_IDS
) {
  if (!level?.multipliers || !Array.isArray(typeIds)) {
    throw new TypeError("Entity weights require level multipliers and type ids.");
  }

  return typeIds.map((typeId) => {
    const tuning = GAME_CONFIG.entityTypes[typeId];
    const typeDefinition = getEntityType(typeId);

    if (!tuning || !Number.isFinite(tuning.baseWeight)) {
      throw new RangeError("Missing base entity weight: " + typeId);
    }

    const weight =
      tuning.baseWeight *
      getWeightMultiplier(typeDefinition, level.multipliers);

    if (!Number.isFinite(weight) || weight <= 0) {
      throw new RangeError("Entity weights must remain positive.");
    }

    return Object.freeze({
      typeId,
      category: typeDefinition?.category ?? "EMPTY",
      weight
    });
  });
}

export function selectWeightedEntityType(weightTable, unitValue) {
  if (!Array.isArray(weightTable) || weightTable.length === 0) {
    throw new TypeError("A non-empty entity weight table is required.");
  }

  const targetUnit = requireUnitValue(unitValue);
  const totalWeight = weightTable.reduce(
    (total, entry) => total + entry.weight,
    0
  );
  let cursor = targetUnit * totalWeight;

  for (const entry of weightTable) {
    cursor -= entry.weight;
    if (cursor < 0) {
      return entry.typeId;
    }
  }

  return weightTable[weightTable.length - 1].typeId;
}

export function sampleEntityOffset({
  trackRadius,
  collisionRadius,
  wallMargin = GAME_CONFIG.track.wallMargin,
  radialUnit,
  angularUnit
}) {
  if (
    !Number.isFinite(trackRadius) ||
    trackRadius <= 0 ||
    !Number.isFinite(collisionRadius) ||
    collisionRadius <= 0 ||
    !Number.isFinite(wallMargin) ||
    wallMargin < 0
  ) {
    throw new RangeError("Entity offsets require valid vessel dimensions.");
  }

  requireUnitValue(radialUnit);
  requireUnitValue(angularUnit);
  const maximumRadius = Math.max(
    0,
    trackRadius - collisionRadius - wallMargin
  );
  const radius = Math.sqrt(radialUnit) * maximumRadius;
  const angle =
    angularUnit * GAME_CONFIG.entities.fullRotationRadians;

  return Object.freeze({
    lateralX: Math.cos(angle) * radius,
    lateralY: Math.sin(angle) * radius,
    radius,
    maximumRadius
  });
}

function isReservedDistance(distance, reservedDistances, padding) {
  return reservedDistances.some(
    (reservedDistance) =>
      Math.abs(distance - reservedDistance) <= padding
  );
}

export class EntityManager {
  #track;
  #level;
  #random;
  #assetFactory;
  #config;
  #woundConfig;
  #weightTable;
  #batches = new Map();
  #active = [];
  #pool = [];
  #schedule = [];
  #scheduleIndex = 0;
  #spawnHistory = [];
  #manualEntityId = 0;
  #recycledCount = 0;

  constructor({
    track,
    level,
    random = new SeededRandom(level?.seed),
    assetFactory = new ProceduralAssetFactory(),
    config = GAME_CONFIG.entities,
    woundConfig = GAME_CONFIG.wound
  } = {}) {
    if (
      !track?.getRadiusAtDistance ||
      !track?.getFrameAtDistance ||
      !Array.isArray(level?.gasExchange?.triggerDistances)
    ) {
      throw new TypeError("EntityManager requires a playable track and level.");
    }

    this.#track = track;
    this.#level = level;
    this.#random = random;
    this.#assetFactory = assetFactory;
    this.#config = config;
    this.#woundConfig = woundConfig;

    if (config.spawnIntervalMin < config.minimumGap) {
      throw new RangeError(
        "Entity spawn interval cannot be smaller than the minimum gap."
      );
    }

    this.#weightTable = buildEntityWeightTable(level);
    this.group = new Group();
    this.group.name = "level-" + level.id + "-entities";

    ENTITY_TYPES.forEach((typeDefinition) => {
      const capacity =
        typeDefinition.category === ENTITY_CATEGORIES.FATAL
          ? woundConfig.maximumActive
          : config.maximumActive;
      const batch = assetFactory.createBatch(typeDefinition, capacity);
      this.#batches.set(typeDefinition.id, batch);
      this.group.add(batch.group);
    });

    this.#schedule = this.#buildSchedule();
    this.#syncBatches();
  }

  get activeEntities() {
    return this.#active;
  }

  get activeCount() {
    return this.#active.length;
  }

  get activeWoundCount() {
    return this.#active.filter(
      (entity) =>
        !entity.consumed &&
        entity.category === ENTITY_CATEGORIES.FATAL
    ).length;
  }

  get pooledCount() {
    return this.#pool.length;
  }

  get recycledCount() {
    return this.#recycledCount;
  }

  get spawnCount() {
    return this.#spawnHistory.length;
  }

  get scheduleCount() {
    return this.#schedule.length;
  }

  get pendingScheduleCount() {
    return this.#schedule.length - this.#scheduleIndex;
  }

  get batchCount() {
    return this.#batches.size;
  }

  get spawnHistory() {
    return this.#spawnHistory.map((entry) => ({ ...entry }));
  }

  get slotHistory() {
    return this.#schedule.map((entry) => ({ ...entry }));
  }

  getNearestAhead(distanceAlongTrack) {
    return (
      this.#active
        .filter(
          (entity) =>
            !entity.consumed &&
            entity.distanceAlongTrack >= distanceAlongTrack
        )
        .sort(
          (first, second) =>
            first.distanceAlongTrack - second.distanceAlongTrack
        )[0] ?? null
    );
  }

  update(playerState, simulationDeltaSeconds) {
    if (
      !isPlayerState(playerState) ||
      !Number.isFinite(simulationDeltaSeconds) ||
      simulationDeltaSeconds < 0
    ) {
      throw new TypeError("Entity updates require player state and valid time.");
    }

    this.#recycleStaleEntities(playerState);
    const activationLimit = Math.min(
      this.#level.end.distance,
      playerState.distanceAlongTrack + this.#config.spawnAheadMax
    );

    while (
      this.#scheduleIndex < this.#schedule.length &&
      this.#schedule[this.#scheduleIndex].distanceAlongTrack <=
        activationLimit
    ) {
      const descriptor = this.#schedule[this.#scheduleIndex];
      const hasReactionDistance =
        descriptor.distanceAlongTrack -
          playerState.distanceAlongTrack >=
        this.#config.spawnAheadMin;

      if (
        hasReactionDistance &&
        !descriptor.reserved &&
        descriptor.typeId !== "empty"
      ) {
        this.#activateDescriptor(descriptor);
      }
      this.#scheduleIndex += 1;
    }

    this.#active.forEach((entity) => {
      entity.animationSeconds += simulationDeltaSeconds;
    });
    this.#syncBatches();
  }

  spawnEntity({
    typeId,
    distanceAlongTrack,
    lateralX = 0,
    lateralY = 0,
    animationPhase = 0
  }) {
    const typeDefinition = getEntityType(typeId);
    if (!typeDefinition) {
      throw new RangeError("Unknown entity type: " + typeId);
    }

    const descriptor = {
      id: "manual-entity-" + this.#manualEntityId,
      typeId,
      distanceAlongTrack,
      lateralX,
      lateralY,
      animationPhase,
      reserved: false
    };
    this.#manualEntityId += 1;
    const entity = this.#activateDescriptor(descriptor);
    this.#syncBatches();
    return entity;
  }

  spawnWoundAhead(playerState) {
    if (!isPlayerState(playerState)) {
      throw new TypeError("Wound spawning requires valid player state.");
    }

    if (this.activeWoundCount >= this.#woundConfig.maximumActive) {
      return null;
    }

    const minimumDistance =
      playerState.distanceAlongTrack + this.#config.spawnAheadMin;
    const maximumDistance = Math.min(
      playerState.distanceAlongTrack + this.#config.spawnAheadMax,
      this.#level.end.distance - this.#config.reservedDistancePadding
    );

    if (maximumDistance <= minimumDistance) {
      return null;
    }

    const woundType = getEntityType("wound");
    const reservedDistances = [
      ...this.#level.gasExchange.triggerDistances,
      this.#level.end.distance
    ];

    for (
      let attempt = 0;
      attempt < this.#woundConfig.placementAttempts;
      attempt += 1
    ) {
      const distanceAlongTrack = this.#random.range(
        minimumDistance,
        maximumDistance
      );
      const tooCloseToWound = this.#active.some(
        (entity) =>
          !entity.consumed &&
          entity.category === ENTITY_CATEGORIES.FATAL &&
          Math.abs(entity.distanceAlongTrack - distanceAlongTrack) <
            this.#woundConfig.minimumGap
      );
      const overlapsReservedDistance = isReservedDistance(
        distanceAlongTrack,
        reservedDistances,
        this.#config.reservedDistancePadding
      );
      const overlapsScheduledEntity = this.#schedule.some(
        (descriptor) =>
          !descriptor.reserved &&
          descriptor.typeId !== "empty" &&
          Math.abs(
            descriptor.distanceAlongTrack - distanceAlongTrack
          ) <= this.#config.reservedDistancePadding
      );
      const overlapsActiveEntity = this.#active.some(
        (entity) =>
          !entity.consumed &&
          Math.abs(entity.distanceAlongTrack - distanceAlongTrack) <=
            this.#config.reservedDistancePadding
      );

      if (
        tooCloseToWound ||
        overlapsReservedDistance ||
        overlapsScheduledEntity ||
        overlapsActiveEntity
      ) {
        continue;
      }

      const offset = sampleEntityOffset({
        trackRadius: this.#track.getRadiusAtDistance(
          distanceAlongTrack
        ),
        collisionRadius: woundType.tuning.collisionRadius,
        radialUnit: this.#random.next(),
        angularUnit: this.#random.next()
      });

      return this.spawnEntity({
        typeId: "wound",
        distanceAlongTrack,
        lateralX: offset.lateralX,
        lateralY: offset.lateralY,
        animationPhase:
          this.#random.next() * this.#config.fullRotationRadians
      });
    }

    return null;
  }

  recycleConsumed() {
    const recycled = this.#recycleWhere((entity) => entity.consumed);

    if (recycled > 0) {
      this.#syncBatches();
    }

    return recycled;
  }

  clear() {
    this.#recycleWhere(() => true);
    this.#syncBatches();
  }

  dispose() {
    this.clear();
    this.#assetFactory.dispose();
    this.group.clear();
  }

  #buildSchedule() {
    const schedule = [];
    const reservedDistances = [
      ...this.#level.gasExchange.triggerDistances,
      this.#level.end.distance
    ];
    let lastDebuffTypeId = "";
    let sameDebuffCount = 0;
    let distanceAlongTrack =
      this.#level.start.distance +
      this.#random.range(
        this.#config.spawnAheadMin,
        this.#config.spawnAheadMax
      );
    let slotIndex = 0;

    while (
      distanceAlongTrack <=
      this.#level.end.distance -
        this.#config.reservedDistancePadding
    ) {
      let typeId = selectWeightedEntityType(
        this.#weightTable,
        this.#random.next()
      );
      let typeDefinition = getEntityType(typeId);

      if (
        typeDefinition?.category === ENTITY_CATEGORIES.DEBUFF &&
        typeId === lastDebuffTypeId &&
        sameDebuffCount >=
          this.#config.maximumConsecutiveSameDebuff
      ) {
        const alternateTable = this.#weightTable.filter(
          (entry) => entry.typeId !== typeId
        );
        typeId = selectWeightedEntityType(
          alternateTable,
          this.#random.next()
        );
        typeDefinition = getEntityType(typeId);
      }

      if (typeDefinition?.category === ENTITY_CATEGORIES.DEBUFF) {
        if (typeId === lastDebuffTypeId) {
          sameDebuffCount += 1;
        } else {
          lastDebuffTypeId = typeId;
          sameDebuffCount = 1;
        }
      } else {
        lastDebuffTypeId = "";
        sameDebuffCount = 0;
      }

      const reserved = isReservedDistance(
        distanceAlongTrack,
        reservedDistances,
        this.#config.reservedDistancePadding
      );
      let lateralX = 0;
      let lateralY = 0;
      let animationPhase = 0;

      if (typeDefinition && !reserved) {
        const offset = sampleEntityOffset({
          trackRadius: this.#track.getRadiusAtDistance(
            distanceAlongTrack
          ),
          collisionRadius: typeDefinition.tuning.collisionRadius,
          radialUnit: this.#random.next(),
          angularUnit: this.#random.next()
        });
        lateralX = offset.lateralX;
        lateralY = offset.lateralY;
        animationPhase =
          this.#random.next() *
          this.#config.fullRotationRadians;
      }

      schedule.push(
        Object.freeze({
          id: "entity-slot-" + slotIndex,
          typeId,
          distanceAlongTrack,
          lateralX,
          lateralY,
          animationPhase,
          reserved
        })
      );
      slotIndex += 1;
      distanceAlongTrack += this.#random.range(
        this.#config.spawnIntervalMin,
        this.#config.spawnIntervalMax
      );
    }

    return schedule;
  }

  #activateDescriptor(descriptor) {
    const typeDefinition = getEntityType(descriptor.typeId);
    const fatalCount = this.#active.filter(
      (entity) => entity.category === ENTITY_CATEGORIES.FATAL
    ).length;
    const generalCount = this.#active.length - fatalCount;
    const hasCapacity =
      typeDefinition.category === ENTITY_CATEGORIES.FATAL
        ? fatalCount < this.#woundConfig.maximumActive
        : generalCount < this.#config.maximumActive;

    if (!hasCapacity) {
      return null;
    }

    const state = createEntityState({
      id: descriptor.id,
      typeId: descriptor.typeId,
      distanceAlongTrack: descriptor.distanceAlongTrack,
      lateralX: descriptor.lateralX,
      lateralY: descriptor.lateralY,
      collisionRadius: typeDefinition.tuning.collisionRadius
    });
    const entity = this.#pool.pop() ?? {};
    Object.assign(entity, state, {
      category: typeDefinition.category,
      displayName: typeDefinition.displayName,
      animationSeconds: 0,
      animationPhase: descriptor.animationPhase
    });
    this.#active.push(entity);
    this.#active.sort(
      (first, second) =>
        first.distanceAlongTrack - second.distanceAlongTrack ||
        first.id.localeCompare(second.id)
    );
    this.#spawnHistory.push({
      id: entity.id,
      typeId: entity.typeId,
      distanceAlongTrack: entity.distanceAlongTrack,
      lateralX: entity.lateralX,
      lateralY: entity.lateralY
    });
    return entity;
  }

  #recycleStaleEntities(playerState) {
    this.#recycleWhere((entity) => {
      const behindDistance =
        playerState.distanceAlongTrack - entity.distanceAlongTrack;

      if (
        entity.category === ENTITY_CATEGORIES.FATAL &&
        behindDistance > this.#woundConfig.dodgedBehindDistance
      ) {
        playerState.woundDodgedCount += 1;
        return true;
      }

      return behindDistance > this.#config.despawnBehind;
    });
  }

  #recycleWhere(predicate) {
    let recycled = 0;

    for (let index = this.#active.length - 1; index >= 0; index -= 1) {
      const entity = this.#active[index];
      if (!predicate(entity)) {
        continue;
      }

      this.#active.splice(index, 1);
      entity.consumed = true;
      this.#pool.push(entity);
      recycled += 1;
      this.#recycledCount += 1;
    }

    return recycled;
  }

  #syncBatches() {
    this.#batches.forEach((batch, typeId) => {
      batch.sync(
        this.#active.filter(
          (entity) => !entity.consumed && entity.typeId === typeId
        ),
        this.#track
      );
    });
  }
}
