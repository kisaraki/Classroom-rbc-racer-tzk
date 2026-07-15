import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { GameSession } from "../../js/core/GameSession.js?v=stable-v1.1-20260715-r2";
import { GAME_STATES } from "../../js/core/GameStateMachine.js?v=stable-v1.1-20260715-r2";
import { LEVELS } from "../../js/data/levels.js?v=stable-v1.1-20260715-r2";
import { GAS_EXCHANGE_STATUS } from "../../js/data/schemas.js?v=stable-v1.1-20260715-r2";
import {
  canCompleteLevel,
  QTE_ACTIONS,
  QTE_EVENTS,
  QTE_OUTCOMES,
  QTE_PHASES,
  QTESystem,
  QTE_TRIGGER_TYPES
} from "../../js/systems/QTESystem.js?v=stable-v1.1-20260715-r2";
import { assertEqual, assertThrows } from "./TestHarness.js";

function createQte(level = LEVELS[0]) {
  return new QTESystem({ level });
}

function startOpportunity(qte, level, index, nowMs = 1000) {
  const distance = level.gasExchange.triggerDistances[index];
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

function expireFailure(qte, startedAtMs) {
  return qte.update(startedAtMs + GAME_CONFIG.qte.durationMs);
}

export function registerQteTests(harness) {
  harness.test("Gas opportunities are longitudinal and unavoidable", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    const event = startOpportunity(qte, level, 0);

    assertEqual(event.type, QTE_EVENTS.STARTED);
    assertEqual(event.triggerType, QTE_TRIGGER_TYPES.OPPORTUNITY);
    assertEqual(event.opportunityNumber, 1);
    assertEqual(event.opportunityCount, 10);
    assertEqual(event.exchangeRegion, "TISSUE");
    assertEqual(qte.phase, QTE_PHASES.INPUT);
    assertEqual(
      qte.qteExpiresAtMs,
      1000 + GAME_CONFIG.qte.durationMs
    );
  });

  harness.test("O and C counts can succeed without alternating", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    startOpportunity(qte, level, 0);
    const event = enterSuccess(qte);

    assertEqual(event.type, QTE_EVENTS.OUTCOME);
    assertEqual(event.outcome, QTE_OUTCOMES.SUCCESS);
    assertEqual(event.scoreDelta, GAME_CONFIG.qte.successScore);
    assertEqual(qte.status, GAS_EXCHANGE_STATUS.SUCCESS);
    assertEqual(qte.attempts, 1);
    assertEqual(qte.nextTriggerDistance, null);
    assertEqual(canCompleteLevel(qte.status), true);
  });

  harness.test("CO poisoning raises both gas exchange counts to nine", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    assertEqual(qte.setCarbonMonoxidePoisoned(true), 9);
    startOpportunity(qte, level, 0);

    for (let index = 0; index < 9; index += 1) {
      qte.recordAction(QTE_ACTIONS.OXYGEN, 1100);
    }
    for (let index = 0; index < 8; index += 1) {
      qte.recordAction(QTE_ACTIONS.CARBON_DIOXIDE, 1100);
    }

    assertEqual(qte.phase, QTE_PHASES.INPUT);
    const success = qte.recordAction(QTE_ACTIONS.CARBON_DIOXIDE, 1100);
    assertEqual(success.outcome, QTE_OUTCOMES.SUCCESS);
    assertEqual(qte.diagnostics.oxygenThreshold, 9);
    assertEqual(qte.diagnostics.carbonDioxideThreshold, 9);
    assertEqual(qte.diagnostics.carbonMonoxidePoisoned, true);
  });

  harness.test("one successful opportunity completes the whole exchange", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    startOpportunity(qte, level, 0, 0);
    const failure = expireFailure(qte, 0);
    qte.update(failure.resultExpiresAtMs);
    startOpportunity(qte, level, 1, 3000);
    const success = enterSuccess(qte, 3100);

    assertEqual(success.outcome, QTE_OUTCOMES.SUCCESS);
    assertEqual(success.opportunityNumber, 2);
    assertEqual(qte.status, GAS_EXCHANGE_STATUS.SUCCESS);
    assertEqual(qte.nextOpportunityIndex, null);
    assertEqual(qte.diagnostics.remainingOpportunities, 8);
  });

  harness.test("a failed opportunity exposes the next event in the same zone", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    startOpportunity(qte, level, 0, 0);
    const event = expireFailure(qte, 0);

    assertEqual(event.outcome, QTE_OUTCOMES.FAILURE);
    assertEqual(event.scoreDelta, GAME_CONFIG.qte.failureScore);
    assertEqual(event.retryAvailable, true);
    assertEqual(qte.status, GAS_EXCHANGE_STATUS.PENDING);
    assertEqual(qte.attempts, 1);
    assertEqual(canCompleteLevel(qte.status), false);

    const expired = qte.update(event.resultExpiresAtMs);
    assertEqual(expired.type, QTE_EVENTS.RESULT_EXPIRED);
    assertEqual(qte.nextTriggerType, QTE_TRIGGER_TYPES.OPPORTUNITY);
    assertEqual(
      qte.nextTriggerDistance,
      level.gasExchange.triggerDistances[1]
    );
    assertEqual(qte.diagnostics.nextOpportunityNumber, 2);
  });

  harness.test("all ten failed tissue events still permit completion", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    let nowMs = 0;
    let failure = null;

    level.gasExchange.triggerDistances.forEach((_, index) => {
      startOpportunity(qte, level, index, nowMs);
      failure = expireFailure(qte, nowMs);

      if (index < level.gasExchange.opportunityCount - 1) {
        qte.update(failure.resultExpiresAtMs);
        nowMs = failure.resultExpiresAtMs + 1;
      }
    });

    assertEqual(qte.attempts, 10);
    assertEqual(qte.status, GAS_EXCHANGE_STATUS.FAILED);
    assertEqual(failure.retryAvailable, false);
    assertEqual(canCompleteLevel(qte.status), true);
  });

  harness.test("lung routes provide twenty opportunities", () => {
    const level = LEVELS[1];
    const qte = createQte(level);

    assertEqual(level.gasExchange.region, "LUNG");
    assertEqual(qte.opportunityCount, 20);
    assertEqual(qte.diagnostics.remainingOpportunities, 20);
    assertEqual(
      level.gasExchange.triggerDistances.length,
      GAME_CONFIG.qte.opportunityCountByRegion.LUNG
    );
  });

  harness.test("QTE does not start outside tissue or lung", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    const exchangeSection = level.sections.find(
      (section) => section.id === level.gasExchange.sectionId
    );

    assertEqual(
      qte.tryStart(
        exchangeSection.startDistance - 10,
        exchangeSection.startDistance,
        0
      ),
      null
    );
    assertEqual(
      qte.tryStart(level.end.distance - 1, level.end.distance, 1000),
      null
    );
  });

  harness.test("moving from the exact event coordinate still triggers", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    const first = level.gasExchange.triggerDistances[0];
    const event = qte.tryStart(first, first + 1, 1000);

    assertEqual(event.type, QTE_EVENTS.STARTED);
    assertEqual(event.triggerType, QTE_TRIGGER_TYPES.OPPORTUNITY);
  });

  harness.test("result deadlines expire by absolute time during a pause", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    startOpportunity(qte, level, 0, 1000);
    const failed = qte.update(2500);
    const expired = qte.update(failed.resultExpiresAtMs + 5000);

    assertEqual(expired.type, QTE_EVENTS.RESULT_EXPIRED);
    assertEqual(qte.phase, QTE_PHASES.IDLE);
  });

  harness.test("a late frame never extends the missed result deadline", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    startOpportunity(qte, level, 0, 0);
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

  harness.test("Level 1 permits transfer after all exchange events fail", () => {
    const level = LEVELS[0];
    const qte = createQte(level);
    const session = new GameSession({
      durationSeconds: level.targetDriveSeconds
    });
    let nowMs = 0;

    session.prepareForPointerLock();
    session.acquirePointerLock();
    assertEqual(session.state, GAME_STATES.PLAYING);

    level.gasExchange.triggerDistances.forEach((_, index) => {
      startOpportunity(qte, level, index, nowMs);
      session.enterQte();
      const failed = expireFailure(qte, nowMs);
      qte.update(failed.resultExpiresAtMs);
      session.completeQte();
      nowMs = failed.resultExpiresAtMs + 1;
    });

    assertEqual(qte.status, GAS_EXCHANGE_STATUS.FAILED);
    assertEqual(session.enterTransferCutscene(), true);
    assertEqual(session.completeTransferCutscene(), true);
    assertEqual(session.state, GAME_STATES.LEVEL_COMPLETE);
  });

  harness.test("QTE rejects unknown input and invalid opportunity data", () => {
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
    assertThrows(() => new QTESystem({ level: {} }), TypeError);
    assertThrows(
      () =>
        new QTESystem({
          level: {
            ...LEVELS[0],
            gasExchange: {
              ...LEVELS[0].gasExchange,
              triggerDistances: [
                LEVELS[0].sections.find(
                  (section) =>
                    section.id === LEVELS[0].gasExchange.sectionId
                ).startDistance,
                ...LEVELS[0].gasExchange.triggerDistances.slice(1)
              ]
            }
          }
        }),
      TypeError
    );
  });
}
