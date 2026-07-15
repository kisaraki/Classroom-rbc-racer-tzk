import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { LevelManager } from "../../js/core/LevelManager.js?v=stable-v1.1-20260715-r2";
import { LEVELS } from "../../js/data/levels.js?v=stable-v1.1-20260715-r2";
import { InputController } from "../../js/input/InputController.js";
import { PlayerRBC } from "../../js/player/PlayerRBC.js";
import { VesselTrack } from "../../js/world/VesselTrack.js?v=stable-v1.1-20260715-r2";
import {
  assert,
  assertApproximately,
  assertDeepEqual,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

const EXPECTED_ROUTE_LABELS = Object.freeze({
  1: [
    "左心室",
    "主動脈",
    "主動脈分支（腹部及下肢）",
    "腹部及下肢的小動脈",
    "腹部及下肢的微血管網",
    "小靜脈",
    "下大靜脈",
    "右心房／右心室"
  ],
  2: [
    "右心室",
    "肺動脈",
    "肺泡微血管",
    "肺靜脈",
    "左心房／左心室"
  ],
  3: [
    "左心室",
    "主動脈",
    "頸動脈／鎖骨下動脈",
    "頭部、胸部及上肢的小動脈",
    "頭部、胸部及上肢的微血管網",
    "小靜脈",
    "上大靜脈",
    "右心房／右心室"
  ],
  4: [
    "右心室",
    "肺動脈",
    "肺泡微血管",
    "肺靜脈",
    "左心房／左心室"
  ]
});

const EXPECTED_TRANSFERS = Object.freeze({
  1: ["右心房", "右心室"],
  2: ["左心房", "左心室"],
  3: ["右心房", "右心室"],
  4: ["左心房", "左心室"]
});

export function registerLevelManagerTests(harness) {
  harness.test("LevelManager loads all four Phase 09 route datasets", () => {
    const manager = new LevelManager();

    assertEqual(manager.levels.length, GAME_CONFIG.game.totalLevelCount);
    assertEqual(manager.currentLevel, LEVELS[0]);

    LEVELS.forEach((level) => {
      assertEqual(manager.loadLevel(level.id), level);
      assertEqual(manager.currentLevel.id, level.id);
    });

    assertThrows(() => manager.loadLevel(5), RangeError);
  });

  harness.test("LevelManager advances all four routes without wrapping", () => {
    const manager = new LevelManager();

    assertEqual(manager.currentLevelIndex, 0);
    assertEqual(manager.hasNextLevel, true);
    assertEqual(manager.peekNextLevel().id, 2);
    assertEqual(manager.loadNextLevel().id, 2);
    assertEqual(manager.loadNextLevel().id, 3);
    assertEqual(manager.loadNextLevel().id, 4);
    assertEqual(manager.hasNextLevel, false);
    assertEqual(manager.peekNextLevel(), null);
    assertEqual(manager.loadNextLevel(), null);
    assertEqual(manager.currentLevel.id, 4);
  });

  harness.test("all levels expose their configured heart transfer", () => {
    LEVELS.forEach((level) => {
      assertDeepEqual(
        [level.transfer.fromChamber, level.transfer.toChamber],
        EXPECTED_TRANSFERS[level.id]
      );
    });
  });

  harness.test("all levels expose their required circulation locations", () => {
    const manager = new LevelManager();

    LEVELS.forEach((level) => {
      manager.loadLevel(level.id);
      assertDeepEqual(
        level.sections.map((section) => section.locationLabel),
        EXPECTED_ROUTE_LABELS[level.id]
      );
      assertEqual(
        manager.getLocationAtDistance(level.start.distance),
        level.start.locationLabel
      );
      assertEqual(
        manager.getLocationAtDistance(level.end.distance),
        level.end.locationLabel
      );
    });
  });

  harness.test("all route sections are distance, color, and minimap continuous", () => {
    LEVELS.forEach((level) => {
      level.sections.forEach((section, index) => {
        const previous = level.sections[index - 1];

        assertEqual(
          section.startDistance,
          index === 0 ? level.start.distance : previous.endDistance
        );
        assertEqual(
          section.minimapStartProgress,
          index === 0 ? 0 : previous.minimapEndProgress
        );

        if (previous) {
          assertEqual(section.colorStart, previous.colorEnd);
        }
      });

      assertEqual(level.sections.at(-1).endDistance, level.end.distance);
      assertEqual(level.sections.at(-1).minimapEndProgress, 1);
    });
  });

  harness.test("minimap progress maps continuously for every level", () => {
    const manager = new LevelManager();

    LEVELS.forEach((level) => {
      manager.loadLevel(level.id);
      assertEqual(manager.getMinimapProgressAtDistance(-10), 0);
      assertApproximately(
        manager.getMinimapProgressAtDistance(level.trackLength / 2),
        0.5,
        Number.EPSILON * 4
      );
      assertEqual(
        manager.getMinimapProgressAtDistance(level.trackLength + 10),
        1
      );
    });
  });

  harness.test("every gas event remains inside its configured exchange zone", () => {
    const manager = new LevelManager();

    LEVELS.forEach((level) => {
      manager.loadLevel(level.id);
      const exchangeSection = level.sections.find(
        (section) => section.gasExchangeZone !== undefined
      );
      const triggers = level.gasExchange.triggerDistances;

      assert(exchangeSection !== undefined);
      assertEqual(exchangeSection.id, level.gasExchange.sectionId);
      assertEqual(exchangeSection.gasExchangeZone, level.gasExchange.region);
      assert(
        triggers.every(
          (distance) =>
            distance > exchangeSection.startDistance &&
            distance < exchangeSection.endDistance
        )
      );
      assert(
        triggers.every(
          (distance, index) => index === 0 || distance > triggers[index - 1]
        )
      );
      assert(
        triggers.every(
          (distance) =>
            manager.getMinimapAnchorAtDistance(distance) ===
            GAME_CONFIG.minimap.exchangeAnchorNodeByRegion[
              level.gasExchange.region
            ]
        )
      );
    });
  });

  harness.test("systemic capillaries have 10 events and pulmonary capillaries have 20", () => {
    LEVELS.forEach((level) => {
      const expectedCount =
        GAME_CONFIG.qte.opportunityCountByRegion[
          level.gasExchange.region
        ];
      const expectedRegion =
        level.circulationType === "SYSTEMIC" ? "TISSUE" : "LUNG";

      assertEqual(
        level.gasExchange.opportunityCount,
        expectedCount
      );
      assertEqual(level.gasExchange.triggerDistances.length, expectedCount);
      assertEqual(level.gasExchange.region, expectedRegion);
    });
  });

  harness.test("all levels expose explicit start and end contracts", () => {
    const manager = new LevelManager();

    LEVELS.forEach((level) => {
      manager.loadLevel(level.id);
      assertEqual(manager.isAtStart(0), true);
      assertEqual(manager.isAtStart(1), false);
      assertEqual(manager.isAtEnd(level.trackLength - 1), false);
      assertEqual(manager.isAtEnd(level.trackLength), true);
    });

    assertThrows(() => manager.getSectionAtDistance(Number.NaN), TypeError);
  });

  LEVELS.forEach((level) => {
    harness.test(
      "Level " + level.id + " BP 100 drives its route in " +
        level.targetDriveSeconds + " seconds",
      () => {
        const track = new VesselTrack({ level });
        const player = new PlayerRBC({
          config: GAME_CONFIG,
          stateOverrides: { currentLevel: level.id }
        });
        const input = new InputController({ target: null });
        const step = GAME_CONFIG.timing.maximumSimulationDeltaSeconds;
        const updateCount = Math.round(level.targetDriveSeconds / step);

        for (let index = 0; index < updateCount; index += 1) {
          player.update(step, input, track);
        }

        assertApproximately(
          player.state.distanceAlongTrack,
          level.end.distance,
          Number.EPSILON
        );
        player.dispose();
        track.dispose();
      }
    );
  });
}
