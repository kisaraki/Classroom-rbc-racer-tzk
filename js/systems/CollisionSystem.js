import { GAME_CONFIG } from "../config.js?v=phase06-qte";
import {
  ENTITY_CATEGORIES,
  getEntityType
} from "../data/entityTypes.js?v=phase06-qte";
import {
  isEntityState,
  isPlayerState
} from "../data/schemas.js?v=phase06-qte";
import { ScoreSystem } from "./ScoreSystem.js?v=phase06-qte";

export function isSweptLongitudinalHit(
  playerState,
  entityState,
  collisionWindow = GAME_CONFIG.collision.window
) {
  if (!Number.isFinite(collisionWindow) || collisionWindow < 0) {
    throw new RangeError("Collision window must be non-negative.");
  }

  const previousRelativeDistance =
    entityState.previousDistanceAlongTrack -
    playerState.previousDistanceAlongTrack;
  const currentRelativeDistance =
    entityState.distanceAlongTrack - playerState.distanceAlongTrack;
  const minimumRelativeDistance = Math.min(
    previousRelativeDistance,
    currentRelativeDistance
  );
  const maximumRelativeDistance = Math.max(
    previousRelativeDistance,
    currentRelativeDistance
  );

  return (
    minimumRelativeDistance <= collisionWindow &&
    maximumRelativeDistance >= -collisionWindow
  );
}

export function isCrossSectionHit(playerState, entityState) {
  const deltaX = entityState.lateralX - playerState.lateralX;
  const deltaY = entityState.lateralY - playerState.lateralY;
  const combinedRadius =
    entityState.collisionRadius + playerState.collisionRadius;

  return deltaX * deltaX + deltaY * deltaY <= combinedRadius * combinedRadius;
}

export function compareCollisionCandidates(
  first,
  second,
  categoryPriority = GAME_CONFIG.collision.categoryPriority
) {
  const firstPriority = categoryPriority[first.type.category];
  const secondPriority = categoryPriority[second.type.category];

  if (!Number.isFinite(firstPriority) || !Number.isFinite(secondPriority)) {
    throw new RangeError("Every collision category needs a configured priority.");
  }

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  if (first.entity.distanceAlongTrack !== second.entity.distanceAlongTrack) {
    return first.entity.distanceAlongTrack - second.entity.distanceAlongTrack;
  }

  return first.entity.id.localeCompare(second.entity.id);
}

function createCollisionEvent(entity, type, scoreChange) {
  return Object.freeze({
    entityId: entity.id,
    typeId: type.id,
    displayName: type.displayName,
    category: type.category,
    trigger: type.trigger ?? null,
    scoreDelta: scoreChange.scoreDelta,
    hpDelta: scoreChange.hpDelta,
    score: scoreChange.score,
    hp: scoreChange.hp
  });
}

export class CollisionSystem {
  constructor({
    config = GAME_CONFIG,
    scoreSystem = new ScoreSystem({ config })
  } = {}) {
    this.config = config;
    this.scoreSystem = scoreSystem;
  }

  collect(playerState, entities) {
    if (!isPlayerState(playerState)) {
      throw new TypeError("A valid player state is required.");
    }

    if (!Array.isArray(entities)) {
      throw new TypeError("Collision entities must be an array.");
    }

    return entities
      .filter((entity) => {
        if (!isEntityState(entity)) {
          throw new TypeError("Collision entity does not match its schema.");
        }

        return (
          !entity.consumed &&
          isSweptLongitudinalHit(
            playerState,
            entity,
            this.config.collision.window
          ) &&
          isCrossSectionHit(playerState, entity)
        );
      })
      .map((entity) => {
        const type = getEntityType(entity.typeId);

        if (!type) {
          throw new RangeError("Unknown collision entity type: " + entity.typeId);
        }

        return { entity, type };
      })
      .sort((first, second) =>
        compareCollisionCandidates(
          first,
          second,
          this.config.collision.categoryPriority
        )
      );
  }

  resolve(playerState, entities) {
    const candidates = this.collect(playerState, entities);
    const events = [];
    const triggers = [];
    const consumedIds = [];
    let fatalTypeId = null;
    let scoreDelta = 0;
    let hpDelta = 0;

    for (const candidate of candidates) {
      if (
        candidate.type.category === ENTITY_CATEGORIES.BUFF &&
        playerState.hp <= this.config.hp.min
      ) {
        break;
      }

      candidate.entity.consumed = true;
      consumedIds.push(candidate.entity.id);

      const scoreChange = this.scoreSystem.apply(
        playerState,
        candidate.type
      );
      const event = createCollisionEvent(
        candidate.entity,
        candidate.type,
        scoreChange
      );
      events.push(event);
      scoreDelta += event.scoreDelta;
      hpDelta += event.hpDelta;

      if (candidate.type.counterKey) {
        const counterValue = playerState[candidate.type.counterKey];

        if (!Number.isInteger(counterValue) || counterValue < 0) {
          throw new TypeError(
            "Entity counter must be a non-negative integer: " +
              candidate.type.counterKey
          );
        }

        playerState[candidate.type.counterKey] += 1;
      }

      if (candidate.type.trigger) {
        triggers.push(candidate.type.trigger);
      }

      if (candidate.type.category === ENTITY_CATEGORIES.FATAL) {
        fatalTypeId = candidate.type.id;
        break;
      }
    }

    return Object.freeze({
      events: Object.freeze(events),
      triggers: Object.freeze(triggers),
      consumedIds: Object.freeze(consumedIds),
      collisionCount: events.length,
      scoreDelta,
      hpDelta,
      fatalTypeId,
      playerDepleted: fatalTypeId === null && playerState.hp <= this.config.hp.min
    });
  }
}
