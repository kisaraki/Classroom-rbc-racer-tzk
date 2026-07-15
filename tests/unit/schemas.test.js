import { GAME_CONFIG } from "../../js/config.js?v=phase09-endings-r1";
import {
  assembleLevel,
  LEVELS
} from "../../js/data/levels.js?v=phase09-endings-r1";
import {
  createEntityState,
  createLevelCheckpoint,
  createPlayerState,
  isEntityState,
  isLevelCheckpoint,
  isLevelData,
  isPlayerState
} from "../../js/data/schemas.js?v=phase09-endings-r1";
import {
  assert,
  assertApproximately,
  assertEqual
} from "./TestHarness.js";

export function registerSchemaTests(harness) {
  harness.test("player and checkpoint factories satisfy their schemas", () => {
    const player = createPlayerState();
    const checkpoint = createLevelCheckpoint(
      player,
      GAME_CONFIG.levels[player.currentLevel].seed
    );

    assert(isPlayerState(player));
    assert(isLevelCheckpoint(checkpoint));
    assertEqual(checkpoint.hp, GAME_CONFIG.hp.initial);
  });

  harness.test("entity factory uses the canonical track coordinates", () => {
    const entity = createEntityState({
      id: "test-entity",
      typeId: "vitaminC",
      distanceAlongTrack: 25,
      lateralX: 1,
      lateralY: -1,
      collisionRadius: GAME_CONFIG.entityTypes.vitaminC.collisionRadius
    });

    assert(isEntityState(entity));
    assertEqual(
      entity.previousDistanceAlongTrack,
      entity.distanceAlongTrack
    );
  });

  harness.test("level assembler combines semantics with config values", () => {
    const tuning = GAME_CONFIG.levels[1];
    const sections = tuning.sectionRatios.map((ratio, index) => ({
      id: "test-section-" + index,
      locationLabel: "Test section",
      minimapSegmentId: "test-segment-" + index
    }));
    const level = assembleLevel(1, {
      name: "Test level",
      hudLabel: "TEST ROUTE",
      circulationType: "SYSTEMIC",
      minimapPathId: "test-path",
      gasExchangeType: "UNSPECIFIED",
      startLocationLabel: "Test start",
      endLocationLabel: "Test end",
      transfer: {
        fromChamber: "Test atrium",
        toChamber: "Test ventricle"
      },
      sections
    });

    assert(isLevelData(level));
    assertEqual(level.trackLength, tuning.trackLength);
    assertEqual(level.sections.length, tuning.sectionRatios.length);
  });

  harness.test("Phase 09 retains four complete data-driven levels", () => {
    assertEqual(LEVELS.length, GAME_CONFIG.game.totalLevelCount);
    assertEqual(LEVELS.map((level) => level.id).join(","), "1,2,3,4");

    LEVELS.forEach((level) => {
      const tuning = GAME_CONFIG.levels[level.id];

      assert(isLevelData(level));
      assertEqual(level.sections.length, tuning.routeSections.length);
      assertEqual(level.controlPoints.length >= 2, true);
      assertEqual(level.start.distance, 0);
      assertEqual(level.end.distance, level.trackLength);
    });
  });

  harness.test("configured level ratios and baseline times are consistent", () => {
    const unclampedBaselineSpeed =
      GAME_CONFIG.movement.minSpeed +
      (GAME_CONFIG.bp.initial - GAME_CONFIG.movement.bpOffset) *
        GAME_CONFIG.movement.speedPerBp;
    const baselineSpeed = Math.min(
      GAME_CONFIG.movement.maxSpeed,
      Math.max(GAME_CONFIG.movement.minSpeed, unclampedBaselineSpeed)
    );

    Object.values(GAME_CONFIG.levels).forEach((level) => {
      const ratioTotal = level.sectionRatios.reduce(
        (total, ratio) => total + ratio,
        0
      );
      assertApproximately(ratioTotal, 1, Number.EPSILON * 4);
      assertApproximately(
        level.trackLength / baselineSpeed,
        level.targetDriveSeconds,
        Number.EPSILON
      );
    });
  });
}
