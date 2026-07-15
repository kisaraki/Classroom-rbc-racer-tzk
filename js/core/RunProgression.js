import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import {
  createPlayerState,
  isLevelCheckpoint,
  RBC_COLOR_STATES
} from "../data/schemas.js?v=stable-v1.1-20260715-r2";

export function createLevelStartPlayerState({
  levelId,
  hp,
  score,
  rbcColorState = RBC_COLOR_STATES.RED
}) {
  return createPlayerState({
    currentLevel: Number(levelId),
    hp,
    score,
    rbcColorState
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
    score: checkpoint.score,
    rbcColorState: checkpoint.rbcColorState
  });
}
