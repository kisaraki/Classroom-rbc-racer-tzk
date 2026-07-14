import { Vector3 } from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js?v=phase05-bp-reflection";
import { ENTITY_TYPES } from "../../js/data/entityTypes.js?v=phase05-bp-reflection";
import { ProceduralAssetFactory } from "../../js/world/ProceduralAssetFactory.js?v=phase05-bp-reflection";
import {
  assert,
  assertEqual
} from "./TestHarness.js";

function createCanvasFactory(textCalls) {
  return () => ({
    width: 0,
    height: 0,
    getContext: () => ({
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      fillText(text) {
        textCalls.push(text);
      },
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      font: "",
      textAlign: "",
      textBaseline: ""
    })
  });
}

function createStraightTrack() {
  return {
    getFrameAtDistance: (distance) => ({
      point: new Vector3(0, 0, -distance),
      tangent: new Vector3(0, 0, -1),
      right: new Vector3(1, 0, 0),
      up: new Vector3(0, 1, 0)
    })
  };
}

function createVisualEntity(type, id = "visual-test") {
  return {
    id,
    typeId: type.id,
    distanceAlongTrack: 42,
    previousDistanceAlongTrack: 42,
    lateralX: 0.5,
    lateralY: -0.25,
    collisionRadius: type.tuning.collisionRadius,
    consumed: false,
    animationSeconds: 1.25,
    animationPhase: 0.4
  };
}

export function registerProceduralAssetTests(harness) {
  harness.test("procedural factory builds InstancedMesh parts for every type", () => {
    const textCalls = [];
    const factory = new ProceduralAssetFactory({
      canvasFactory: createCanvasFactory(textCalls)
    });
    const track = createStraightTrack();

    ENTITY_TYPES.forEach((type) => {
      const batch = factory.createBatch(type, 2);
      batch.sync([createVisualEntity(type)], track);

      assertEqual(batch.count, 1);
      assertEqual(
        batch.partCount,
        GAME_CONFIG.entityVisuals.models[type.modelKey].parts.length
      );
      assert(
        batch.instanceMeshes.every((mesh) => mesh.isInstancedMesh),
        type.id + " must use InstancedMesh rendering."
      );
    });

    assertEqual(factory.batchCount, 7);
    factory.dispose();
    assertEqual(factory.batchCount, 0);
  });

  harness.test("CanvasTexture labels preserve exact configured text", () => {
    const textCalls = [];
    const factory = new ProceduralAssetFactory({
      canvasFactory: createCanvasFactory(textCalls)
    });
    const expectedLabels = ENTITY_TYPES
      .map((type) => type.label)
      .filter(Boolean);

    ENTITY_TYPES.forEach((type) => {
      const batch = factory.createBatch(type, 1);

      if (type.label) {
        assertEqual(batch.labelTexture.userData.label, type.label);
        assertEqual(batch.labelTexture.isCanvasTexture, true);
      } else {
        assertEqual(batch.labelTexture, null);
      }
    });

    assertEqual(textCalls.join("|"), expectedLabels.join("|"));
    factory.dispose();
  });

  harness.test("malaria uses an irregular core with appendages and no label", () => {
    const malariaType = ENTITY_TYPES.find((type) => type.id === "malaria");
    const model = GAME_CONFIG.entityVisuals.models.malaria;
    const factory = new ProceduralAssetFactory({
      canvasFactory: createCanvasFactory([])
    });
    const batch = factory.createBatch(malariaType, 1);

    assertEqual(model.parts[0].geometry, "irregularIcosahedron");
    assert(model.parts.some((part) => part.geometry === "torusKnot"));
    assert(
      model.parts.filter((part) => part.geometry === "cone").length >= 4
    );
    assertEqual(batch.labelTexture, null);
    factory.dispose();
  });
}
