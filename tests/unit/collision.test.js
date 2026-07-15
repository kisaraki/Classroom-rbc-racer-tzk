import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import {
  ENTITY_TRIGGERS,
  getEntityType
} from "../../js/data/entityTypes.js?v=stable-v1.1-20260715-r2";
import {
  createEntityState,
  createPlayerState
} from "../../js/data/schemas.js?v=stable-v1.1-20260715-r2";
import {
  CollisionSystem,
  isCrossSectionHit,
  isEntityLabelHit,
  isSweptLongitudinalHit
} from "../../js/systems/CollisionSystem.js?v=stable-v1.1-20260715-r2";
import { applyEntityScoreEffect } from "../../js/systems/ScoreSystem.js?v=stable-v1.1-20260715-r2";
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

  harness.test("player collision spans the reticle to the RBC lower edge", () => {
    const player = createMovingPlayer();
    const profile = GAME_CONFIG.collision.playerProfile;
    const lowerBodyHit = createEntity("malaria", {
      lateralY: profile.bottomOffsetY + 0.1
    });
    const aboveReticle = createEntity("malaria", {
      lateralY:
        profile.topOffsetY + lowerBodyHit.collisionRadius + 0.01
    });
    const belowBody = createEntity("malaria", {
      lateralY:
        profile.bottomOffsetY - lowerBodyHit.collisionRadius - 0.01
    });

    assertEqual(isCrossSectionHit(player, lowerBodyHit), true);
    assertEqual(isCrossSectionHit(player, aboveReticle), false);
    assertEqual(isCrossSectionHit(player, belowBody), false);
  });

  harness.test("buff and debuff label panels are collision surfaces", () => {
    const player = createMovingPlayer();
    const labelledTypeIds = [
      "vitaminC",
      "vitaminB12",
      "iron",
      "carbonMonoxide",
      "alcohol"
    ];

    labelledTypeIds.forEach((typeId) => {
      const type = getEntityType(typeId);
      const entity = createEntity(typeId, {
        lateralX:
          player.collisionRadius + type.tuning.collisionRadius + 0.05,
        lateralY: -1.2
      });

      assertEqual(isEntityLabelHit(player, entity), true);
      assertEqual(isCrossSectionHit(player, entity), true);
    });

    const malaria = createEntity("malaria", {
      lateralX:
        player.collisionRadius +
        getEntityType("malaria").tuning.collisionRadius +
        0.05,
      lateralY: -1.2
    });
    const wound = createEntity("wound", {
      lateralX:
        player.collisionRadius +
        getEntityType("wound").tuning.collisionRadius +
        0.05,
      lateralY: -1.2
    });

    assertEqual(isEntityLabelHit(player, malaria), false);
    assertEqual(isCrossSectionHit(player, malaria), false);
    assertEqual(isEntityLabelHit(player, wound), false);
    assertEqual(isCrossSectionHit(player, wound), false);
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
    assertEqual(result.scoreDelta, -6);
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
    assertEqual(result.scoreDelta, -6);
    assertEqual(result.hpDelta, -6);
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
    assertEqual(player.score, -6);
    assertEqual(player.hp, GAME_CONFIG.hp.initial - 6);
    assertEqual(player.malariaCount, 1);
    assertEqual(player.carbonMonoxideCount, 0);
  });

  harness.test("debuff multiplier doubles CO deductions and tracks collisions", () => {
    const player = createMovingPlayer();
    const carbonMonoxide = createEntity("carbonMonoxide");
    const result = new CollisionSystem().resolve(player, [carbonMonoxide]);

    assertEqual(result.scoreDelta, -4);
    assertEqual(result.hpDelta, -4);
    assertEqual(player.carbonMonoxideCount, 1);
    assertEqual(GAME_CONFIG.penalties.debuffMultiplier, 2);
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
