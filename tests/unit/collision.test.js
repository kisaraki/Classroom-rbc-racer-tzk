import { GAME_CONFIG } from "../../js/config.js?v=phase09-endings-r1";
import {
  ENTITY_TRIGGERS,
  getEntityType
} from "../../js/data/entityTypes.js?v=phase09-endings-r1";
import {
  createEntityState,
  createPlayerState
} from "../../js/data/schemas.js?v=phase09-endings-r1";
import {
  CollisionSystem,
  isCrossSectionHit,
  isSweptLongitudinalHit
} from "../../js/systems/CollisionSystem.js?v=phase09-endings-r1";
import { applyEntityScoreEffect } from "../../js/systems/ScoreSystem.js?v=phase09-endings-r1";
import {
  assertEqual,
  assertThrows
} from "./TestHarness.js";

function createMovingPlayer(overrides = {}) {
  return createPlayerState({
    previousDistanceAlongTrack: 0,
    distanceAlongTrack: 10,
    lateralX: 0,
    lateralY: 0,
    ...overrides
  });
}

function createEntity(typeId, overrides = {}) {
  const type = getEntityType(typeId);

  return createEntityState({
    id: overrides.id ?? typeId + "-test",
    typeId,
    previousDistanceAlongTrack:
      overrides.previousDistanceAlongTrack ?? 5,
    distanceAlongTrack: overrides.distanceAlongTrack ?? 5,
    lateralX: overrides.lateralX ?? 0,
    lateralY: overrides.lateralY ?? 0,
    collisionRadius: type.tuning.collisionRadius,
    consumed: overrides.consumed ?? false
  });
}

export function registerCollisionTests(harness) {
  harness.test("swept longitudinal collision prevents high-speed tunneling", () => {
    const player = createMovingPlayer();
    const entity = createEntity("vitaminC");

    assertEqual(isSweptLongitudinalHit(player, entity), true);
    assertEqual(isCrossSectionHit(player, entity), true);
  });

  harness.test("cross-section radii reject a lateral near miss", () => {
    const player = createMovingPlayer();
    const entity = createEntity("vitaminC", {
      lateralX:
        GAME_CONFIG.track.playerCollisionRadius +
        getEntityType("vitaminC").tuning.collisionRadius +
        0.01
    });
    const result = new CollisionSystem().resolve(player, [entity]);

    assertEqual(isCrossSectionHit(player, entity), false);
    assertEqual(result.collisionCount, 0);
    assertEqual(entity.consumed, false);
  });

  harness.test("buff score applies while HP remains clamped to max", () => {
    const player = createMovingPlayer({ hp: GAME_CONFIG.hp.max });
    const change = applyEntityScoreEffect(
      player,
      getEntityType("vitaminC")
    );

    assertEqual(change.scoreDelta, 1);
    assertEqual(change.hpDelta, 0);
    assertEqual(player.score, 1);
    assertEqual(player.hp, GAME_CONFIG.hp.max);
  });

  harness.test("Wound resolves first, is fatal, and never subtracts HP", () => {
    const player = createMovingPlayer();
    const wound = createEntity("wound", { distanceAlongTrack: 8 });
    const malaria = createEntity("malaria", { distanceAlongTrack: 4 });
    const vitamin = createEntity("vitaminC", { distanceAlongTrack: 6 });
    const result = new CollisionSystem().resolve(player, [
      vitamin,
      malaria,
      wound
    ]);

    assertEqual(result.fatalTypeId, "wound");
    assertEqual(result.collisionCount, 1);
    assertEqual(result.events[0].typeId, "wound");
    assertEqual(result.scoreDelta, -200);
    assertEqual(result.hpDelta, 0);
    assertEqual(player.hp, GAME_CONFIG.hp.initial);
    assertEqual(wound.consumed, true);
    assertEqual(malaria.consumed, false);
    assertEqual(vitamin.consumed, false);
  });

  harness.test("debuffs resolve before buffs and HP depletion stops recovery", () => {
    const player = createMovingPlayer({ hp: 2 });
    const malaria = createEntity("malaria");
    const vitamin = createEntity("vitaminC");
    const result = new CollisionSystem().resolve(player, [vitamin, malaria]);

    assertEqual(result.playerDepleted, true);
    assertEqual(result.collisionCount, 1);
    assertEqual(result.events[0].typeId, "malaria");
    assertEqual(result.scoreDelta, -3);
    assertEqual(result.hpDelta, -2);
    assertEqual(player.hp, GAME_CONFIG.hp.min);
    assertEqual(malaria.consumed, true);
    assertEqual(vitamin.consumed, false);
  });

  harness.test("same-priority collisions sort by distance then stable id", () => {
    const player = createMovingPlayer();
    const far = createEntity("alcohol", {
      id: "far",
      distanceAlongTrack: 7
    });
    const sameZ = createEntity("alcohol", {
      id: "z-id",
      distanceAlongTrack: 5
    });
    const sameA = createEntity("alcohol", {
      id: "a-id",
      distanceAlongTrack: 5
    });
    const result = new CollisionSystem().resolve(player, [far, sameZ, sameA]);

    assertEqual(
      result.events.map((event) => event.entityId).join("|"),
      "a-id|z-id|far"
    );
    assertEqual(result.scoreDelta, -3);
    assertEqual(result.hpDelta, -3);
    assertEqual(player.alcoholCount, 3);
  });

  harness.test("malaria emits its hood trigger and consumed entities stay ignored", () => {
    const player = createMovingPlayer();
    const ignored = createEntity("carbonMonoxide", { consumed: true });
    const malaria = createEntity("malaria");
    const result = new CollisionSystem().resolve(player, [ignored, malaria]);

    assertEqual(result.collisionCount, 1);
    assertEqual(result.triggers[0], ENTITY_TRIGGERS.MALARIA_HOOD);
    assertEqual(ignored.consumed, true);
    assertEqual(player.score, -3);
    assertEqual(player.hp, GAME_CONFIG.hp.initial - 3);
  });

  harness.test("collision helpers reject invalid window values", () => {
    assertThrows(
      () =>
        isSweptLongitudinalHit(
          createMovingPlayer(),
          createEntity("vitaminC"),
          -0.1
        ),
      RangeError
    );
  });
}
