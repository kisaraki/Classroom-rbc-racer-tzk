import { Group, Vector3 } from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { getEntityType } from "../../js/data/entityTypes.js?v=stable-v1.1-20260715-r2";
import { LEVELS } from "../../js/data/levels.js?v=stable-v1.1-20260715-r2";
import { createPlayerState } from "../../js/data/schemas.js?v=stable-v1.1-20260715-r2";
import {
  EntityManager,
  buildEntityWeightTable,
  sampleEntityOffset
} from "../../js/systems/EntityManager.js?v=stable-v1.1-20260715-r2";
import {
  assert,
  assertApproximately,
  assertDeepEqual,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

class FakeBatch {
  constructor(typeId) {
    this.group = new Group();
    this.group.name = "fake-batch-" + typeId;
    this.entityIds = [];
  }

  sync(entities) {
    this.entityIds = entities.map((entity) => entity.id);
  }

  dispose() {
    this.group.clear();
  }
}

class FakeAssetFactory {
  constructor() {
    this.batches = [];
  }

  createBatch(typeDefinition) {
    const batch = new FakeBatch(typeDefinition.id);
    this.batches.push(batch);
    return batch;
  }

  dispose() {
    this.batches.forEach((batch) => batch.dispose());
    this.batches = [];
  }
}

function createStraightTrack() {
  return {
    getRadiusAtDistance: () => GAME_CONFIG.track.radii.greatVessel,
    getFrameAtDistance: (distance) => ({
      point: new Vector3(0, 0, -distance),
      tangent: new Vector3(0, 0, -1),
      right: new Vector3(1, 0, 0),
      up: new Vector3(0, 1, 0)
    })
  };
}

function createManager() {
  return new EntityManager({
    track: createStraightTrack(),
    level: LEVELS[0],
    assetFactory: new FakeAssetFactory()
  });
}

export function registerEntityManagerTests(harness) {
  harness.test("identical level seeds produce identical entity schedules", () => {
    const first = createManager();
    const second = createManager();

    assertDeepEqual(first.slotHistory, second.slotHistory);
    assertEqual(first.batchCount, 7);
    first.dispose();
    second.dispose();
  });

  harness.test("entity schedule preserves spacing, reservations, and vessel bounds", () => {
    const manager = createManager();
    const schedule = manager.slotHistory;
    const level = LEVELS[0];
    const reservedDistances = [
      ...level.gasExchange.triggerDistances,
      level.end.distance
    ];

    schedule.forEach((slot, index) => {
      const expectedReserved = reservedDistances.some(
        (distance) =>
          Math.abs(slot.distanceAlongTrack - distance) <=
          GAME_CONFIG.entities.reservedDistancePadding
      );
      assertEqual(slot.reserved, expectedReserved);
      assertEqual(slot.typeId === "wound", false);

      if (index > 0) {
        const gap =
          slot.distanceAlongTrack -
          schedule[index - 1].distanceAlongTrack;
        assert(
          gap >= GAME_CONFIG.entities.spawnIntervalMin &&
            gap <= GAME_CONFIG.entities.spawnIntervalMax,
          "Entity longitudinal slots must stay in the configured interval."
        );
      }

      const type = getEntityType(slot.typeId);
      if (type && !slot.reserved) {
        const maximumRadius =
          GAME_CONFIG.track.radii.greatVessel -
          type.tuning.collisionRadius -
          GAME_CONFIG.track.wallMargin;
        assert(
          Math.hypot(slot.lateralX, slot.lateralY) <= maximumRadius,
          "Entity must remain inside the vessel wall."
        );
      }
    });

    manager.dispose();
  });

  harness.test("schedule fairness limits identical consecutive debuffs to two", () => {
    const manager = createManager();
    let previousDebuff = "";
    let consecutiveCount = 0;

    manager.slotHistory.forEach((slot) => {
      const type = getEntityType(slot.typeId);

      if (type?.category !== "DEBUFF") {
        previousDebuff = "";
        consecutiveCount = 0;
        return;
      }

      consecutiveCount =
        slot.typeId === previousDebuff ? consecutiveCount + 1 : 1;
      previousDebuff = slot.typeId;
      assert(
        consecutiveCount <=
          GAME_CONFIG.entities.maximumConsecutiveSameDebuff
      );
    });

    manager.dispose();
  });

  harness.test("level multipliers and uniform-area offsets are data driven", () => {
    const weights = buildEntityWeightTable({
      multipliers: GAME_CONFIG.levels[4].multipliers
    });
    const weightsByType = new Map(
      weights.map((entry) => [entry.typeId, entry.weight])
    );
    const offset = sampleEntityOffset({
      trackRadius: 5,
      collisionRadius: 0.5,
      wallMargin: 0.5,
      radialUnit: 0.25,
      angularUnit: 0
    });

    assertApproximately(weightsByType.get("vitaminC"), 12.6, Number.EPSILON * 8);
    assertApproximately(weightsByType.get("vitaminB12"), 9.8, Number.EPSILON * 8);
    assertApproximately(weightsByType.get("iron"), 9.8, Number.EPSILON * 8);
    assertEqual(weightsByType.get("carbonMonoxide"), 50);
    assertEqual(weightsByType.get("malaria"), 25);
    assertEqual(weightsByType.get("alcohol"), 80);
    assertEqual(weightsByType.get("empty"), 8);
    assertApproximately(offset.maximumRadius, 4, Number.EPSILON);
    assertApproximately(offset.radius, 2, Number.EPSILON);
    assertApproximately(offset.lateralX, 2, Number.EPSILON);
    assertApproximately(offset.lateralY, 0, Number.EPSILON);
  });

  harness.test("spawn interval must honor the configured minimum gap", () => {
    assertThrows(
      () =>
        new EntityManager({
          track: createStraightTrack(),
          level: LEVELS[0],
          assetFactory: new FakeAssetFactory(),
          config: {
            ...GAME_CONFIG.entities,
            spawnIntervalMin: GAME_CONFIG.entities.minimumGap - 0.1
          }
        }),
      RangeError
    );
  });

  harness.test("EntityManager activates ahead, pools consumed objects, and caps batches", () => {
    const manager = createManager();
    const player = createPlayerState();
    manager.update(player, 0);

    manager.activeEntities.forEach((entity) => {
      const ahead = entity.distanceAlongTrack - player.distanceAlongTrack;
      assert(
        ahead >= GAME_CONFIG.entities.spawnAheadMin &&
          ahead <= GAME_CONFIG.entities.spawnAheadMax
      );
    });

    manager.clear();
    const first = manager.spawnEntity({
      typeId: "vitaminC",
      distanceAlongTrack: 100
    });
    first.consumed = true;
    assertEqual(manager.recycleConsumed(), 1);
    const reused = manager.spawnEntity({
      typeId: "vitaminB12",
      distanceAlongTrack: 110
    });
    assertEqual(reused, first);

    manager.clear();
    for (
      let index = 0;
      index < GAME_CONFIG.entities.maximumActive;
      index += 1
    ) {
      assert(
        manager.spawnEntity({
          typeId: "vitaminC",
          distanceAlongTrack: 200 + index * 3
        })
      );
    }
    assertEqual(
      manager.spawnEntity({
        typeId: "vitaminC",
        distanceAlongTrack: 500
      }),
      null
    );

    manager.clear();
    for (
      let index = 0;
      index < GAME_CONFIG.wound.maximumActive;
      index += 1
    ) {
      assert(
        manager.spawnEntity({
          typeId: "wound",
          distanceAlongTrack: 600 + index * 50
        })
      );
    }
    assertEqual(
      manager.spawnEntity({
        typeId: "wound",
        distanceAlongTrack: 900
      }),
      null
    );
    manager.dispose();
  });

  harness.test("passing an unconsumed Wound records one successful dodge", () => {
    const manager = createManager();
    manager.clear();
    manager.spawnEntity({
      typeId: "wound",
      distanceAlongTrack: 100
    });
    const player = createPlayerState({
      previousDistanceAlongTrack: 110,
      distanceAlongTrack:
        100 + GAME_CONFIG.wound.dodgedBehindDistance + 0.1
    });

    manager.update(player, 0);
    assertEqual(player.woundDodgedCount, 1);
    manager.update(player, 0);
    assertEqual(player.woundDodgedCount, 1);
    manager.dispose();
  });

  harness.test("BP-triggered Wound spawns ahead with safe reservations", () => {
    const firstManager = createManager();
    const secondManager = createManager();
    const player = createPlayerState();
    const firstWound = firstManager.spawnWoundAhead(player);
    const repeatedWound = secondManager.spawnWoundAhead(player);

    assert(firstWound, "A valid first-level Wound position must be found.");
    assertEqual(firstWound.typeId, "wound");
    assertEqual(firstManager.activeWoundCount, 1);
    assert(
      firstWound.distanceAlongTrack - player.distanceAlongTrack >=
        GAME_CONFIG.entities.spawnAheadMin
    );
    assert(
      firstWound.distanceAlongTrack - player.distanceAlongTrack <=
        GAME_CONFIG.entities.spawnAheadMax
    );
    assertApproximately(
      firstWound.distanceAlongTrack,
      repeatedWound.distanceAlongTrack,
      Number.EPSILON
    );
    assertApproximately(
      firstWound.lateralX,
      repeatedWound.lateralX,
      Number.EPSILON
    );
    assertApproximately(
      firstWound.lateralY,
      repeatedWound.lateralY,
      Number.EPSILON
    );

    const reservedDistances = [
      ...LEVELS[0].gasExchange.triggerDistances,
      LEVELS[0].end.distance
    ];
    reservedDistances.forEach((distance) => {
      assert(
        Math.abs(firstWound.distanceAlongTrack - distance) >
          GAME_CONFIG.entities.reservedDistancePadding
      );
    });
    firstManager.slotHistory
      .filter((slot) => !slot.reserved && slot.typeId !== "empty")
      .forEach((slot) => {
        assert(
          Math.abs(
            firstWound.distanceAlongTrack - slot.distanceAlongTrack
          ) > GAME_CONFIG.entities.reservedDistancePadding
        );
      });

    const maximumOffset =
      GAME_CONFIG.track.radii.greatVessel -
      GAME_CONFIG.entityTypes.wound.collisionRadius -
      GAME_CONFIG.track.wallMargin;
    assert(
      Math.hypot(firstWound.lateralX, firstWound.lateralY) <=
        maximumOffset
    );
    firstManager.dispose();
    secondManager.dispose();
  });

  harness.test("Wound placement rejects an unsafe gap and route end", () => {
    const manager = createManager();
    manager.clear();
    manager.spawnEntity({
      typeId: "wound",
      distanceAlongTrack:
        (GAME_CONFIG.entities.spawnAheadMin +
          GAME_CONFIG.entities.spawnAheadMax) /
        2
    });

    assertEqual(manager.spawnWoundAhead(createPlayerState()), null);
    manager.clear();
    const nearEndDistance =
      LEVELS[0].end.distance - GAME_CONFIG.entities.spawnAheadMin;
    assertEqual(
      manager.spawnWoundAhead(
        createPlayerState({
          previousDistanceAlongTrack: nearEndDistance,
          distanceAlongTrack: nearEndDistance
        })
      ),
      null
    );
    manager.dispose();
  });
}
