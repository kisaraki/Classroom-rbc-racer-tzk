import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import {
  createLevelStartPlayerState,
  createRetryPlayerState
} from "../../js/core/RunProgression.js?v=stable-v1.1-20260715-r2";
import {
  GAS_EXCHANGE_STATUS,
  RBC_COLOR_STATES
} from "../../js/data/schemas.js?v=stable-v1.1-20260715-r2";
import {
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerRunProgressionTests(harness) {
  harness.test("next level preserves HP and Score while clearing transient state", () => {
    const state = createLevelStartPlayerState({
      levelId: 3,
      hp: 64,
      score: 275,
      rbcColorState: RBC_COLOR_STATES.RED_PURPLE
    });

    assertEqual(state.currentLevel, 3);
    assertEqual(state.hp, 64);
    assertEqual(state.score, 275);
    assertEqual(state.bp, GAME_CONFIG.bp.initial);
    assertEqual(state.distanceAlongTrack, 0);
    assertEqual(state.previousDistanceAlongTrack, 0);
    assertEqual(state.alcoholCount, 0);
    assertEqual(state.gasExchangeStatus, GAS_EXCHANGE_STATUS.PENDING);
    assertEqual(state.gasExchangeAttempts, 0);
    assertEqual(state.rbcColorState, RBC_COLOR_STATES.RED_PURPLE);
  });

  harness.test("retry restores checkpoint score and configured minimum HP", () => {
    const state = createRetryPlayerState({
      levelId: 2,
      hp: 18,
      score: 125,
      seed: GAME_CONFIG.levels[2].seed,
      rbcColorState: RBC_COLOR_STATES.RED_PURPLE
    });

    assertEqual(state.currentLevel, 2);
    assertEqual(state.hp, GAME_CONFIG.checkpoint.retryMinimumHp);
    assertEqual(state.score, 125);
    assertEqual(state.bp, GAME_CONFIG.bp.initial);
    assertEqual(state.lateralX, 0);
    assertEqual(state.lateralY, 0);
    assertEqual(state.woundDodgedCount, 0);
    assertEqual(state.qteSuccessCount, 0);
    assertEqual(state.rbcColorState, RBC_COLOR_STATES.RED_PURPLE);
  });

  harness.test("retry clamps checkpoint HP and rejects invalid checkpoints", () => {
    const state = createRetryPlayerState({
      levelId: 4,
      hp: GAME_CONFIG.hp.max + 50,
      score: 0,
      seed: GAME_CONFIG.levels[4].seed,
      rbcColorState: RBC_COLOR_STATES.RED
    });

    assertEqual(state.hp, GAME_CONFIG.hp.max);
    assertThrows(() => createRetryPlayerState({}), TypeError);
    assertThrows(
      () => createLevelStartPlayerState({ levelId: 5, hp: 100, score: 0 }),
      TypeError
    );
  });
}
