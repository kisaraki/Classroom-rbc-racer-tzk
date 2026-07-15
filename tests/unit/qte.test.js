import { GAME_CONFIG } from "../../js/config.js?v=phase08-routes-r1";
import { LEVELS } from "../../js/data/levels.js?v=phase08-routes-r1";
import { GAS_EXCHANGE_STATUS } from "../../js/data/schemas.js?v=phase08-routes-r1";
import { GameSession } from "../../js/core/GameSession.js?v=phase08-routes-r1";
import { GAME_STATES } from "../../js/core/GameStateMachine.js?v=phase08-routes-r1";
import {
  canCompleteLevel,
  QTE_ACTIONS,
  QTE_EVENTS,
  QTE_OUTCOMES,
  QTE_PHASES,
  QTESystem,
  QTE_TRIGGER_TYPES
} from "../../js/systems/QTESystem.js?v=phase08-routes-r1";
import { assertEqual, assertThrows } from "./TestHarness.js";

function createQte() {
  return new QTESystem({ level: LEVELS[0] });
}

function startAt(qte, triggerKey, nowMs = 1000) {
  const distance = LEVELS[0].gasTriggerDistances[triggerKey];
  return qte.tryStart(distance - 1, distance, nowMs);
}

function enterSuccess(qte, nowMs = 1100) {
  const actions = [
    QTE_ACTIONS.OXYGEN,
    QTE_ACTIONS.OXYGEN,
    QTE_ACTIONS.OXYGEN,
    QTE_ACTIONS.CARBON_DIOXIDE,
    QTE_ACTIONS.CARBON_DIOXIDE,
    QTE_ACTIONS.CARBON_DIOXIDE
  ];
  let event = null;

  actions.forEach((action) => {
    event = qte.recordAction(action, nowMs);
  });
  return event;
}

export function registerQteTests(harness) {
  harness.test("primary Gas trigger is longitudinal and unavoidable", () => {
    const qte = createQte();
    const event = startAt(qte, "primary");

    assertEqual(event.type, QTE_EVENTS.STARTED);
    assertEqual(event.triggerType, QTE_TRIGGER_TYPES.PRIMARY);
    assertEqual(qte.phase, QTE_PHASES.INPUT);
    assertEqual(
      qte.qteExpiresAtMs,
      1000 + GAME_CONFIG.qte.durationMs
    );
  });

  harness.test("O and C counts can succeed without alternating", () => {
    const qte = createQte();
    startAt(qte, "primary");
    const event = enterSuccess(qte);

    assertEqual(event.type, QTE_EVENTS.OUTCOME);
    assertEqual(event.outcome, QTE_OUTCOMES.SUCCESS);
    assertEqual(event.scoreDelta, GAME_CONFIG.qte.successScore);
    assertEqual(qte.status, GAS_EXCHANGE_STATUS.SUCCESS);
    assertEqual(qte.attempts, 1);
    assertEqual(qte.nextTriggerDistance, null);
    assertEqual(canCompleteLevel(qte.status), true);
  });

  harness.test("first timeout keeps PENDING and exposes one retry", () => {
    const qte = createQte();
    startAt(qte, "primary", 0);
    const event = qte.update(GAME_CONFIG.qte.durationMs);

    assertEqual(event.outcome, QTE_OUTCOMES.FAILURE);
    assertEqual(event.scoreDelta, GAME_CONFIG.qte.failureScore);
    assertEqual(event.retryAvailable, true);
    assertEqual(qte.status, GAS_EXCHANGE_STATUS.PENDING);
    assertEqual(qte.attempts, 1);
    assertEqual(canCompleteLevel(qte.status), false);
    assertEqual(
      qte.resultExpiresAtMs,
      GAME_CONFIG.qte.durationMs + GAME_CONFIG.qte.resultDisplayMs
    );

    const expired = qte.update(qte.resultExpiresAtMs);
    assertEqual(expired.type, QTE_EVENTS.RESULT_EXPIRED);
    assertEqual(qte.nextTriggerType, QTE_TRIGGER_TYPES.RETRY);
    assertEqual(
      qte.nextTriggerDistance,
      LEVELS[0].gasTriggerDistances.retry
    );
  });

  harness.test("second timeout sets FAILED but still permits completion", () => {
    const qte = createQte();
    startAt(qte, "primary", 0);
    qte.update(GAME_CONFIG.qte.durationMs);
    qte.update(
      GAME_CONFIG.qte.durationMs + GAME_CONFIG.qte.resultDisplayMs
    );
    startAt(qte, "retry", 3000);
    const event = qte.update(3000 + GAME_CONFIG.qte.durationMs);

    assertEqual(event.retryAvailable, false);
    assertEqual(qte.status, GAS_EXCHANGE_STATUS.FAILED);
    assertEqual(qte.attempts, GAME_CONFIG.qte.maxAttempts);
    assertEqual(canCompleteLevel(qte.status), true);
  });

  harness.test("fallback guarantees a pending exchange before the end", () => {
    const qte = createQte();
    const fallback = LEVELS[0].gasTriggerDistances.fallback;
    const event = qte.tryStart(fallback - 1, fallback, 1000);

    assertEqual(event.triggerType, QTE_TRIGGER_TYPES.FALLBACK);
    assertEqual(qte.phase, QTE_PHASES.INPUT);
  });

  harness.test("moving forward from the exact token coordinate still triggers", () => {
    const qte = createQte();
    const primary = LEVELS[0].gasTriggerDistances.primary;
    const event = qte.tryStart(primary, primary + 1, 1000);

    assertEqual(event.type, QTE_EVENTS.STARTED);
    assertEqual(event.triggerType, QTE_TRIGGER_TYPES.PRIMARY);
  });

  harness.test("result deadlines expire by absolute time during a pause", () => {
    const qte = createQte();
    startAt(qte, "primary", 1000);
    const failed = qte.update(2500);
    const expired = qte.update(failed.resultExpiresAtMs + 5000);

    assertEqual(expired.type, QTE_EVENTS.RESULT_EXPIRED);
    assertEqual(qte.phase, QTE_PHASES.IDLE);
  });

  harness.test("a late frame never extends the missed result deadline", () => {
    const qte = createQte();
    startAt(qte, "primary", 0);
    const lateNowMs =
      GAME_CONFIG.qte.durationMs +
      GAME_CONFIG.qte.resultDisplayMs +
      5000;
    const failed = qte.update(lateNowMs);

    assertEqual(
      failed.resultExpiresAtMs,
      GAME_CONFIG.qte.durationMs + GAME_CONFIG.qte.resultDisplayMs
    );
    assertEqual(
      qte.update(lateNowMs).type,
      QTE_EVENTS.RESULT_EXPIRED
    );
  });

  harness.test("Level 1 vertical slice permits completion after two failures", () => {
    const qte = createQte();
    const session = new GameSession({
      durationSeconds: LEVELS[0].targetDriveSeconds
    });
    session.prepareForPointerLock();
    session.acquirePointerLock();
    assertEqual(session.state, GAME_STATES.PLAYING);

    startAt(qte, "primary", 0);
    session.enterQte();
    qte.update(GAME_CONFIG.qte.durationMs);
    qte.update(
      GAME_CONFIG.qte.durationMs + GAME_CONFIG.qte.resultDisplayMs
    );
    session.completeQte();

    startAt(qte, "retry", 3000);
    session.enterQte();
    qte.update(3000 + GAME_CONFIG.qte.durationMs);
    qte.update(
      3000 +
        GAME_CONFIG.qte.durationMs +
        GAME_CONFIG.qte.resultDisplayMs
    );
    session.completeQte();

    assertEqual(qte.status, GAS_EXCHANGE_STATUS.FAILED);
    assertEqual(canCompleteLevel(qte.status), true);
    assertEqual(session.enterTransferCutscene(), true);
    assertEqual(session.completeTransferCutscene(), true);
    assertEqual(session.state, GAME_STATES.LEVEL_COMPLETE);
  });

  harness.test("QTE rejects unknown input and invalid completion status", () => {
    const qte = createQte();
    assertThrows(() => qte.recordAction("KeyX", 0), RangeError);
    assertThrows(() => canCompleteLevel("UNKNOWN"), RangeError);
    assertThrows(
      () =>
        new QTESystem({
          level: LEVELS[0],
          config: { ...GAME_CONFIG.qte, durationMs: 0 }
        }),
      TypeError
    );
  });
}
