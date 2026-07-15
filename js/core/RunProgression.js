import { GAME_CONFIG } from "../config.js?v=phase09-endings-r1";
import {
  createPlayerState,
  isLevelCheckpoint
} from "../data/schemas.js?v=phase09-endings-r1";

export function createLevelStartPlayerState({ levelId, hp, score }) {
  return createPlayerState({
    currentLevel: Number(levelId),
    hp,
    score
  });
}

export function createRetryPlayerState(checkpoint) {
  if (!isLevelCheckpoint(checkpoint)) {
    throw new TypeError("Retry requires a valid level checkpoint.");
  }

  return createLevelStartPlayerState({
    levelId: checkpoint.levelId,
    hp: Math.min(
      GAME_CONFIG.hp.max,
      Math.max(checkpoint.hp, GAME_CONFIG.checkpoint.retryMinimumHp)
    ),
    score: checkpoint.score
  });
}
