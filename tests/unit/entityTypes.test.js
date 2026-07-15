import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import {
  ENTITY_CATEGORIES,
  ENTITY_TYPES,
  GENERAL_SPAWN_TYPE_IDS,
  getEntityType
} from "../../js/data/entityTypes.js?v=stable-v1.1-20260715-r2";
import {
  assert,
  assertDeepEqual,
  assertEqual
} from "./TestHarness.js";

const EXPECTED_LABELS = Object.freeze({
  vitaminC: "C",
  vitaminB12: "B12",
  iron: "Fe²⁺",
  carbonMonoxide: "CO",
  malaria: "",
  alcohol: "C₂H₅OH",
  wound: "Wound"
});

export function registerEntityTypeTests(harness) {
  harness.test("Phase 04 defines all seven procedural entity types", () => {
    assertEqual(ENTITY_TYPES.length, 7);
    assertDeepEqual(
      ENTITY_TYPES.map((type) => type.id),
      Object.keys(EXPECTED_LABELS)
    );

    ENTITY_TYPES.forEach((type) => {
      assertEqual(type.label, EXPECTED_LABELS[type.id]);
      assert(
        GAME_CONFIG.entityVisuals.models[type.modelKey].parts.length > 0,
        type.id + " must have configured procedural parts."
      );
    });
  });

  harness.test("general spawn weights never include Wound", () => {
    assertEqual(GENERAL_SPAWN_TYPE_IDS.includes("wound"), false);
    assertEqual(GENERAL_SPAWN_TYPE_IDS.includes("empty"), true);
    assertEqual(
      getEntityType("wound").category,
      ENTITY_CATEGORIES.FATAL
    );
  });

  harness.test("entity effects match the Phase 04 balance table", () => {
    const actual = ENTITY_TYPES.map((type) => ({
      id: type.id,
      scoreDelta: type.tuning.scoreDelta ?? 0,
      hpDelta: type.tuning.hpDelta ?? 0
    }));

    assertDeepEqual(actual, [
      { id: "vitaminC", scoreDelta: 1, hpDelta: 1 },
      { id: "vitaminB12", scoreDelta: 1, hpDelta: 1 },
      { id: "iron", scoreDelta: 1, hpDelta: 1 },
      { id: "carbonMonoxide", scoreDelta: -2, hpDelta: -2 },
      { id: "malaria", scoreDelta: -3, hpDelta: -3 },
      { id: "alcohol", scoreDelta: -1, hpDelta: -1 },
      { id: "wound", scoreDelta: -200, hpDelta: 0 }
    ]);
  });

  harness.test("buff and debuff radii cover their pulsing visual bodies", () => {
    const expectedBodyRadii = {
      vitaminC: 0.77,
      vitaminB12: 0.81,
      iron: 0.8,
      carbonMonoxide: 0.75,
      malaria: 1.19,
      alcohol: 1.08
    };

    Object.entries(expectedBodyRadii).forEach(([typeId, radius]) => {
      assertEqual(getEntityType(typeId).tuning.collisionRadius, radius);
    });
  });
}
