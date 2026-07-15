import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { createFlightInstrumentSnapshot } from "../../js/ui/FlightInstrumentModel.js?v=stable-v1.1-20260715-r2";
import {
  assertApproximately,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

function createSnapshot(overrides = {}) {
  return createFlightInstrumentSnapshot({
    lateralX: 0,
    lateralY: 0,
    collisionRadius: GAME_CONFIG.track.playerCollisionRadius,
    vesselRadius: 6.5,
    wallMargin: GAME_CONFIG.track.wallMargin,
    viewYaw: 0,
    viewPitch: 0,
    pitchLimitRadians: GAME_CONFIG.camera.pitchLimitRadians,
    ...overrides
  });
}

export function registerFlightInstrumentTests(harness) {
  harness.test("neutral body and view controls share only the screen center", () => {
    const snapshot = createSnapshot();

    assertEqual(snapshot.attitudeX, 0);
    assertEqual(snapshot.attitudeY, 0);
    assertEqual(snapshot.bodyReticleLeftPercent, 50);
    assertEqual(snapshot.bodyReticleTopPercent, 50);
    assertEqual(snapshot.viewReticleLeftPercent, 50);
    assertEqual(snapshot.viewReticleTopPercent, 50);
    assertEqual(snapshot.headingDegrees, 0);
  });

  harness.test("keyboard body cross follows local vessel offsets", () => {
    const maximumCenterOffset =
      6.5 -
      GAME_CONFIG.track.playerCollisionRadius -
      GAME_CONFIG.track.wallMargin;
    const snapshot = createSnapshot({
      lateralX: maximumCenterOffset,
      lateralY: -maximumCenterOffset
    });

    assertEqual(snapshot.attitudeX, 1);
    assertEqual(snapshot.attitudeY, -1);
    assertEqual(
      snapshot.bodyReticleLeftPercent,
      50 + GAME_CONFIG.flightInstruments.bodyReticleTravelXPercent
    );
    assertEqual(
      snapshot.bodyReticleTopPercent,
      50 + GAME_CONFIG.flightInstruments.bodyReticleTravelYPercent
    );
  });

  harness.test("ALT bounds follow the current vessel diameter", () => {
    const chamber = createSnapshot({ vesselRadius: 6.5 });
    const capillary = createSnapshot({ vesselRadius: 3.2 });

    assertEqual(chamber.altitudeMinimum, 0);
    assertEqual(chamber.altitudeMaximum, 13);
    assertEqual(chamber.altitude, 6.5);
    assertEqual(capillary.altitudeMinimum, 0);
    assertEqual(capillary.altitudeMaximum, 6.4);
    assertEqual(capillary.altitude, 3.2);
    assertEqual(capillary.altitudeRatio, 0.5);
  });

  harness.test("mouse view circle maps yaw and pitch without changing attitude", () => {
    const snapshot = createSnapshot({
      viewYaw: -Math.PI / 4,
      viewPitch: Math.PI / 6
    });

    assertEqual(snapshot.attitudeX, 0);
    assertEqual(snapshot.attitudeY, 0);
    assertApproximately(snapshot.viewYawRatio, 0.5, Number.EPSILON);
    assertApproximately(snapshot.viewPitchRatio, 0.5, Number.EPSILON);
    assertApproximately(
      snapshot.viewReticleLeftPercent,
      50 + GAME_CONFIG.flightInstruments.viewReticleTravelXPercent / 2,
      Number.EPSILON
    );
    assertApproximately(
      snapshot.viewReticleTopPercent,
      50 - GAME_CONFIG.flightInstruments.viewReticleTravelYPercent / 2,
      Number.EPSILON
    );
    assertApproximately(snapshot.headingDegrees, 45, 0.000000000001);
    assertApproximately(snapshot.pitchDegrees, 30, 0.000000000001);
  });

  harness.test("flight instruments reject invalid vessel dimensions", () => {
    assertThrows(() => createSnapshot({ vesselRadius: 0 }), RangeError);
    assertThrows(
      () => createSnapshot({ vesselRadius: 0.8, collisionRadius: 0.55 }),
      RangeError
    );
    assertThrows(() => createSnapshot({ viewYaw: Number.NaN }), TypeError);
  });
}
