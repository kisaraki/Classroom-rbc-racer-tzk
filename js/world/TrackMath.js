function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(label + " must be a finite number.");
  }
}

function assertTrackLength(trackLength) {
  assertFiniteNumber(trackLength, "trackLength");

  if (trackLength <= 0) {
    throw new RangeError("trackLength must be greater than zero.");
  }
}

export function clamp(value, min, max) {
  assertFiniteNumber(value, "value");
  assertFiniteNumber(min, "min");
  assertFiniteNumber(max, "max");

  if (max < min) {
    throw new RangeError("max cannot be less than min.");
  }

  return Math.min(max, Math.max(min, value));
}

export function distanceToNormalizedProgress(distanceAlongTrack, trackLength) {
  assertFiniteNumber(distanceAlongTrack, "distanceAlongTrack");
  assertTrackLength(trackLength);
  return clamp(distanceAlongTrack / trackLength, 0, 1);
}

export function normalizedProgressToDistance(normalizedProgress, trackLength) {
  assertFiniteNumber(normalizedProgress, "normalizedProgress");
  assertTrackLength(trackLength);
  return clamp(normalizedProgress, 0, 1) * trackLength;
}

export function clampLateralOffset(
  lateralX,
  lateralY,
  trackRadius,
  collisionRadius,
  wallMargin
) {
  assertFiniteNumber(lateralX, "lateralX");
  assertFiniteNumber(lateralY, "lateralY");
  assertFiniteNumber(trackRadius, "trackRadius");
  assertFiniteNumber(collisionRadius, "collisionRadius");
  assertFiniteNumber(wallMargin, "wallMargin");

  if (trackRadius <= 0 || collisionRadius < 0 || wallMargin < 0) {
    throw new RangeError(
      "trackRadius must be positive and margins cannot be negative."
    );
  }

  const maximumOffset = Math.max(
    0,
    trackRadius - collisionRadius - wallMargin
  );
  const offsetLength = Math.hypot(lateralX, lateralY);

  if (offsetLength <= maximumOffset || offsetLength === 0) {
    return {
      lateralX,
      lateralY,
      maximumOffset,
      hitWall: false
    };
  }

  const scale = maximumOffset / offsetLength;

  return {
    lateralX: lateralX * scale,
    lateralY: lateralY * scale,
    maximumOffset,
    hitWall: true
  };
}
