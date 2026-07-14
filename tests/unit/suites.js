import { registerBloodPressureDrivingTests } from "./bloodPressureDriving.test.js";
import { registerBloodPressureHazardTests } from "./bloodPressureHazards.test.js?v=phase05-bp-reflection";
import { registerCameraTests } from "./camera.test.js";
import { registerCollisionTests } from "./collision.test.js?v=phase05-bp-reflection";
import { registerDeviceSupportTests } from "./deviceSupport.test.js?v=phase05-bp-reflection";
import { registerEntityManagerTests } from "./entityManager.test.js?v=phase05-bp-reflection";
import { registerEntityTypeTests } from "./entityTypes.test.js?v=phase05-bp-reflection";
import { TestHarness } from "./TestHarness.js";
import { registerEventBusTests } from "./eventBus.test.js";
import { registerGameStateTests } from "./gameState.test.js?v=phase05-bp-reflection";
import { registerInputTests } from "./input.test.js?v=phase05-bp-reflection-r2";
import { registerHudTests } from "./hud.test.js?v=phase05-bp-reflection";
import { registerLevelManagerTests } from "./levelManager.test.js?v=phase05-bp-reflection";
import { registerMinimapTests } from "./minimap.test.js?v=phase05-bp-reflection";
import { registerPlayerRbcTests } from "./playerRbc.test.js?v=phase05-bp-reflection";
import { registerPointerLockTests } from "./pointerLock.test.js?v=phase05-bp-reflection";
import { registerProceduralAssetTests } from "./proceduralAssets.test.js?v=phase05-bp-reflection";
import { registerSchemaTests } from "./schemas.test.js?v=phase05-bp-reflection";
import { registerSeededRandomTests } from "./seededRandom.test.js";
import { registerTimingTests } from "./timing.test.js?v=phase01-real-clock";
import { registerTrackMathTests } from "./trackMath.test.js";
import { registerVendorTests } from "./vendor.test.js";
import { registerVesselTrackTests } from "./vesselTrack.test.js?v=phase05-bp-reflection";
import { registerWoundChanceTests } from "./woundChance.test.js?v=phase05-bp-reflection";

export function createPhase05TestHarness() {
  const harness = new TestHarness();

  registerTrackMathTests(harness);
  registerTimingTests(harness);
  registerWoundChanceTests(harness);
  registerBloodPressureHazardTests(harness);
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
  registerEntityTypeTests(harness);
  registerProceduralAssetTests(harness);
  registerEntityManagerTests(harness);
  registerCollisionTests(harness);
  registerDeviceSupportTests(harness);

  return harness;
}
