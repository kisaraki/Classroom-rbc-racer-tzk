import { GAME_CONFIG } from "../../js/config.js?v=phase03-hud-map";
import { LevelManager } from "../../js/core/LevelManager.js?v=phase03-hud-map";
import { LEVELS } from "../../js/data/levels.js?v=phase03-hud-map";
import { InputController } from "../../js/input/InputController.js";
import { PlayerRBC } from "../../js/player/PlayerRBC.js";
import { VesselTrack } from "../../js/world/VesselTrack.js?v=phase03-hud-map";
import {
  assert,
  assertApproximately,
  assertDeepEqual,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerLevelManagerTests(harness) {
  harness.test("LevelManager loads only the authorized first level", () => {
    const manager = new LevelManager();

    assertEqual(manager.levels.length, 1);
    assertEqual(manager.currentLevel, LEVELS[0]);
    assertEqual(manager.currentLevel.id, 1);
    assertEqual(manager.currentLevel.trackLength, 3000);
    assertThrows(() => manager.loadLevel(2), RangeError);
  });

  harness.test("level one sections expose the required circulation route", () => {
    const manager = new LevelManager();

    assertDeepEqual(
      manager.currentLevel.sections.map((section) => section.locationLabel),
      [
        "左心室",
        "主動脈",
        "降主動脈",
        "下半身小動脈",
        "組織微血管",
        "小靜脈",
        "下大靜脈",
        "右心房／右心室"
      ]
    );
    assertEqual(manager.getLocationAtDistance(0), "左心室");
    assertEqual(manager.getLocationAtDistance(90), "主動脈");
    assertEqual(manager.getLocationAtDistance(450), "降主動脈");
    assertEqual(manager.getLocationAtDistance(1200), "下半身小動脈");
    assertEqual(manager.getLocationAtDistance(1650), "組織微血管");
    assertEqual(manager.getLocationAtDistance(2100), "小靜脈");
    assertEqual(manager.getLocationAtDistance(2400), "下大靜脈");
    assertEqual(manager.getLocationAtDistance(2850), "右心房／右心室");
    assertEqual(manager.getLocationAtDistance(3000), "右心室");
  });

  harness.test("level one route sections are contiguous and color-continuous", () => {
    const sections = LEVELS[0].sections;

    sections.forEach((section, index) => {
      assertEqual(
        section.startDistance,
        index === 0 ? LEVELS[0].start.distance : sections[index - 1].endDistance
      );
      assertEqual(
        section.minimapStartProgress,
        index === 0
          ? 0
          : sections[index - 1].minimapEndProgress
      );

      if (index > 0) {
        assertEqual(section.colorStart, sections[index - 1].colorEnd);
      }
    });

    assertEqual(
      sections[sections.length - 1].endDistance,
      LEVELS[0].end.distance
    );
    assertEqual(
      sections[sections.length - 1].minimapEndProgress,
      1
    );
  });

  harness.test("minimap progress maps continuously across every section", () => {
    const manager = new LevelManager();

    assertEqual(manager.currentLevel.minimapPathId, "systemic-lower-circulation-path");
    assertEqual(manager.getMinimapProgressAtDistance(-10), 0);
    assertApproximately(
      manager.getMinimapProgressAtDistance(1500),
      0.5,
      Number.EPSILON
    );
    assertEqual(manager.getMinimapProgressAtDistance(3010), 1);
  });

  harness.test("gas trigger distances stay inside the tissue capillary", () => {
    const manager = new LevelManager();
    const level = manager.currentLevel;
    const capillary = level.sections.find(
      (section) => section.gasExchangeZone === "SYSTEMIC_TISSUE"
    );
    const triggers = Object.values(level.gasTriggerDistances);

    assert(capillary !== undefined);
    assert(triggers.every(
      (distance) =>
        distance >= capillary.startDistance &&
        distance <= capillary.endDistance
    ));
    assert(triggers[0] < triggers[1]);
    assert(triggers[1] < triggers[2]);
  });

  harness.test("first level exposes explicit start and end contracts", () => {
    const manager = new LevelManager();

    assertEqual(manager.isAtStart(0), true);
    assertEqual(manager.isAtStart(1), false);
    assertEqual(manager.isAtEnd(2999), false);
    assertEqual(manager.isAtEnd(3000), true);
    assertThrows(() => manager.getSectionAtDistance(Number.NaN), TypeError);
  });

  harness.test("BP 100 drives the unobstructed route in 300 seconds", () => {
    const manager = new LevelManager();
    const track = new VesselTrack({ level: manager.currentLevel });
    const player = new PlayerRBC({
      config: GAME_CONFIG,
      stateOverrides: { currentLevel: manager.currentLevel.id }
    });
    const input = new InputController({ target: null });
    const step = GAME_CONFIG.timing.maximumSimulationDeltaSeconds;
    const updateCount = Math.round(
      manager.currentLevel.targetDriveSeconds / step
    );

    for (let index = 0; index < updateCount; index += 1) {
      player.update(step, input, track);
    }

    assertApproximately(
      player.state.distanceAlongTrack,
      manager.currentLevel.end.distance,
      Number.EPSILON
    );
    assertEqual(manager.isAtEnd(player.state.distanceAlongTrack), true);
    player.dispose();
    track.dispose();
  });
}
