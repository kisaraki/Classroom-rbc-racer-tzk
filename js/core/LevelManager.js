import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import { LEVELS } from "../data/levels.js?v=stable-v1.1-20260715-r2";
import { isLevelData } from "../data/schemas.js?v=stable-v1.1-20260715-r2";

function requireDistance(distanceAlongTrack) {
  if (!Number.isFinite(distanceAlongTrack)) {
    throw new TypeError("distanceAlongTrack must be a finite number.");
  }

  return distanceAlongTrack;
}

export class LevelManager {
  #levels;
  #levelsById;
  #currentLevel;

  constructor({
    levels = LEVELS,
    initialLevelId = GAME_CONFIG.game.initialLevelId
  } = {}) {
    if (!Array.isArray(levels) || levels.length === 0) {
      throw new TypeError("LevelManager requires at least one level.");
    }

    this.#levels = Object.freeze([...levels]);
    this.#levelsById = new Map();

    this.#levels.forEach((level) => {
      if (!isLevelData(level)) {
        throw new TypeError("LevelManager received invalid level data.");
      }

      if (this.#levelsById.has(level.id)) {
        throw new RangeError("Level ids must be unique.");
      }

      this.#levelsById.set(level.id, level);
    });

    this.loadLevel(initialLevelId);
  }

  get levels() {
    return this.#levels;
  }

  get currentLevel() {
    return this.#currentLevel;
  }

  get currentLevelIndex() {
    return this.#levels.indexOf(this.#currentLevel);
  }

  get hasNextLevel() {
    return this.currentLevelIndex < this.#levels.length - 1;
  }

  peekNextLevel() {
    return this.hasNextLevel
      ? this.#levels[this.currentLevelIndex + 1]
      : null;
  }

  loadNextLevel() {
    const nextLevel = this.peekNextLevel();

    if (!nextLevel) {
      return null;
    }

    this.#currentLevel = nextLevel;
    return nextLevel;
  }

  loadLevel(levelId) {
    const level = this.#levelsById.get(Number(levelId));

    if (!level) {
      throw new RangeError("Playable level is not available: " + levelId);
    }

    this.#currentLevel = level;
    return level;
  }

  getSectionAtDistance(distanceAlongTrack) {
    const distance = Math.min(
      this.#currentLevel.end.distance,
      Math.max(
        this.#currentLevel.start.distance,
        requireDistance(distanceAlongTrack)
      )
    );

    return (
      this.#currentLevel.sections.find(
        (section) =>
          distance >= section.startDistance &&
          (distance < section.endDistance ||
            section.endDistance === this.#currentLevel.end.distance)
      ) ?? this.#currentLevel.sections[this.#currentLevel.sections.length - 1]
    );
  }

  getLocationAtDistance(distanceAlongTrack) {
    if (this.isAtEnd(distanceAlongTrack)) {
      return this.#currentLevel.end.locationLabel;
    }

    return this.getSectionAtDistance(distanceAlongTrack).locationLabel;
  }

  getMinimapProgressAtDistance(distanceAlongTrack) {
    const section = this.getSectionAtDistance(distanceAlongTrack);
    const distance = Math.min(
      section.endDistance,
      Math.max(section.startDistance, distanceAlongTrack)
    );
    const localProgress =
      (distance - section.startDistance) /
      (section.endDistance - section.startDistance);

    return (
      section.minimapStartProgress +
      (section.minimapEndProgress - section.minimapStartProgress) *
        localProgress
    );
  }

  getMinimapAnchorAtDistance(distanceAlongTrack) {
    const region = this.getSectionAtDistance(
      distanceAlongTrack
    ).gasExchangeZone;

    if (!region) {
      return null;
    }

    return GAME_CONFIG.minimap.exchangeAnchorNodeByRegion[region] ?? null;
  }

  isAtStart(distanceAlongTrack) {
    return (
      requireDistance(distanceAlongTrack) <=
      this.#currentLevel.start.distance
    );
  }

  isAtEnd(distanceAlongTrack) {
    return (
      requireDistance(distanceAlongTrack) >=
      this.#currentLevel.end.distance
    );
  }
}
