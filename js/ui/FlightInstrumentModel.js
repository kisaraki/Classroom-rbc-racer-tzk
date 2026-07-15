import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function requireFinite(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }

  return value;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeHeadingDegrees(yaw, config) {
  const rawHeading =
    -yaw * config.angleDegreesPerRadian;
  return (
    (rawHeading % config.fullCircleDegrees) +
    config.fullCircleDegrees
  ) % config.fullCircleDegrees;
}

export function createFlightInstrumentSnapshot({
  lateralX,
  lateralY,
  collisionRadius,
  vesselRadius,
  wallMargin,
  viewYaw,
  viewPitch,
  pitchLimitRadians,
  config = GAME_CONFIG.flightInstruments
}) {
  requireFinite(lateralX, "lateralX");
  requireFinite(lateralY, "lateralY");
  requireFinite(collisionRadius, "collisionRadius");
  requireFinite(vesselRadius, "vesselRadius");
  requireFinite(wallMargin, "wallMargin");
  requireFinite(viewYaw, "viewYaw");
  requireFinite(viewPitch, "viewPitch");
  requireFinite(pitchLimitRadians, "pitchLimitRadians");

  if (
    collisionRadius <= 0 ||
    vesselRadius <= 0 ||
    wallMargin < 0 ||
    pitchLimitRadians <= 0
  ) {
    throw new RangeError("Flight instruments require valid vessel dimensions.");
  }

  const maximumCenterOffset =
    vesselRadius - collisionRadius - wallMargin;

  if (maximumCenterOffset <= 0) {
    throw new RangeError("The RBC does not fit inside the current vessel.");
  }

  const attitudeX = clamp(lateralX / maximumCenterOffset, -1, 1);
  const attitudeY = clamp(lateralY / maximumCenterOffset, -1, 1);
  const vesselDiameter = vesselRadius * 2;
  const altitude = clamp(lateralY + vesselRadius, 0, vesselDiameter);
  const altitudeRatio = altitude / vesselDiameter;
  const viewYawRatio = clamp(
    -viewYaw / config.viewYawDisplayRangeRadians,
    -1,
    1
  );
  const viewPitchRatio = clamp(
    viewPitch / pitchLimitRadians,
    -1,
    1
  );
  const headingDegrees = normalizeHeadingDegrees(viewYaw, config);
  const signedHeadingDegrees =
    headingDegrees > config.halfCircleDegrees
      ? headingDegrees - config.fullCircleDegrees
      : headingDegrees;

  return Object.freeze({
    attitudeX,
    attitudeY,
    maximumCenterOffset,
    bodyReticleLeftPercent:
      50 + attitudeX * config.bodyReticleTravelXPercent,
    bodyReticleTopPercent:
      50 - attitudeY * config.bodyReticleTravelYPercent,
    altitude,
    altitudeMinimum: 0,
    altitudeMaximum: vesselDiameter,
    altitudeRatio,
    vesselRadius,
    vesselDiameter,
    viewYaw,
    viewPitch,
    viewYawRatio,
    viewPitchRatio,
    viewReticleLeftPercent:
      50 + viewYawRatio * config.viewReticleTravelXPercent,
    viewReticleTopPercent:
      50 - viewPitchRatio * config.viewReticleTravelYPercent,
    headingDegrees,
    signedHeadingDegrees,
    pitchDegrees: viewPitch * config.angleDegreesPerRadian
  });
}
