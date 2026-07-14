import { registerBloodPressureDrivingTests } from "./bloodPressureDriving.test.js";
import { registerCameraTests } from "./camera.test.js";
import { TestHarness } from "./TestHarness.js";
import { registerEventBusTests } from "./eventBus.test.js";
import { registerGameStateTests } from "./gameState.test.js";
import { registerInputTests } from "./input.test.js";
import { registerHudTests } from "./hud.test.js?v=phase03-hud-map";
import { registerLevelManagerTests } from "./levelManager.test.js?v=phase03-hud-map";
import { registerMinimapTests } from "./minimap.test.js?v=phase03-hud-map";
import { registerPlayerRbcTests } from "./playerRbc.test.js";
import { registerPointerLockTests } from "./pointerLock.test.js?v=phase03-hud-map";
import { registerSchemaTests } from "./schemas.test.js?v=phase03-hud-map";
import { registerSeededRandomTests } from "./seededRandom.test.js";
import { registerTimingTests } from "./timing.test.js?v=phase01-real-clock";
import { registerTrackMathTests } from "./trackMath.test.js";
import { registerVendorTests } from "./vendor.test.js";
import { registerVesselTrackTests } from "./vesselTrack.test.js?v=phase03-hud-map";
import { registerWoundChanceTests } from "./woundChance.test.js";

export function createPhase03TestHarness() {
  const harness = new TestHarness();

  registerTrackMathTests(harness);
  registerTimingTests(harness);
  registerWoundChanceTests(harness);
  registerSeededRandomTests(harness);
  registerEventBusTests(harness);
  registerSchemaTests(harness);
  registerLevelManagerTests(harness);
  registerMinimapTests(harness);
  registerHudTests(harness);
  registerVendorTests(harness);
  registerBloodPressureDrivingTests(harness);
  registerInputTests(harness);
  registerGameStateTests(harness);
  registerPointerLockTests(harness);
  registerVesselTrackTests(harness);
  registerPlayerRbcTests(harness);
  registerCameraTests(harness);

  return harness;
}
