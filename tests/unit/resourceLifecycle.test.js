import { Vector3 } from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { PlayerRBC } from "../../js/player/PlayerRBC.js?v=stable-v1.1-20260715-r2";
import { ProceduralAssetFactory } from "../../js/world/ProceduralAssetFactory.js?v=stable-v1.1-20260715-r2";
import { VesselTrack } from "../../js/world/VesselTrack.js?v=stable-v1.1-20260715-r2";
import { LEVELS } from "../../js/data/levels.js?v=stable-v1.1-20260715-r2";
import { assert, assertEqual } from "./TestHarness.js";

function createCanvasFactory() {
  return () => ({
    width: 0,
    height: 0,
    getContext: () => ({
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      fillText() {},
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

function watchDispose(resource) {
  let count = 0;
  resource.addEventListener("dispose", () => {
    count += 1;
  });
  return () => count;
}

function collectObjectResources(...roots) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  roots.forEach((root) => {
    root.traverse((object) => {
      if (object.geometry) {
        geometries.add(object.geometry);
      }

      const objectMaterials = Array.isArray(object.material)
        ? object.material
        : object.material
          ? [object.material]
          : [];
      objectMaterials.forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value?.isTexture) {
            textures.add(value);
          }
        });
      });
    });
  });

  return { geometries, materials, textures };
}

function collectOwnedBatchResources(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((object) => {
    if (object.isInstancedMesh) {
      geometries.add(object.geometry);
    }

    if (object.isInstancedMesh || object.isSprite) {
      materials.add(object.material);
      Object.values(object.material).forEach((value) => {
        if (value?.isTexture) {
          textures.add(value);
        }
      });
    }
  });

  return { geometries, materials, textures };
}

function watchResourceSet(resources) {
  return [...resources].map((resource) => watchDispose(resource));
}

function assertDisposedOnce(watchers, label) {
  assert(watchers.length > 0, label + " must expose resources.");
  watchers.forEach((getCount) => {
    assertEqual(getCount(), 1, label + " must dispose each resource once.");
  });
}

export function registerResourceLifecycleTests(harness) {
  harness.test("VesselTrack releases Geometry, Material, and Texture resources", () => {
    const track = new VesselTrack({ level: LEVELS[0] });
    const resources = collectObjectResources(track.group);
    resources.textures.add(track.flowTexture);
    const geometryWatchers = watchResourceSet(resources.geometries);
    const materialWatchers = watchResourceSet(resources.materials);
    const textureWatchers = watchResourceSet(resources.textures);

    track.dispose();

    assertDisposedOnce(geometryWatchers, "Vessel geometry");
    assertDisposedOnce(materialWatchers, "Vessel material");
    assertDisposedOnce(textureWatchers, "Vessel texture");
    assertEqual(track.group.children.length, 0);
  });

  harness.test("PlayerRBC releases cockpit and body resources", () => {
    const player = new PlayerRBC();
    const resources = collectObjectResources(
      player.worldGroup,
      player.cockpitGroup
    );
    resources.textures.add(player.labelTexture);
    const geometryWatchers = watchResourceSet(resources.geometries);
    const materialWatchers = watchResourceSet(resources.materials);
    const textureWatchers = watchResourceSet(resources.textures);

    player.dispose();

    assertDisposedOnce(geometryWatchers, "Player geometry");
    assertDisposedOnce(materialWatchers, "Player material");
    assertDisposedOnce(textureWatchers, "Player texture");
    assertEqual(player.worldGroup.children.length, 0);
    assertEqual(player.cockpitGroup.children.length, 0);
  });

  harness.test("procedural InstancedMesh batches release all owned resources", () => {
    const factory = new ProceduralAssetFactory({
      canvasFactory: createCanvasFactory()
    });
    const token = factory.createGasToken(createStraightTrack());
    const resources = collectOwnedBatchResources(token.group);
    resources.textures.add(token.labelTexture);
    const geometryWatchers = watchResourceSet(resources.geometries);
    const materialWatchers = watchResourceSet(resources.materials);
    const textureWatchers = watchResourceSet(resources.textures);

    factory.dispose();

    assertDisposedOnce(geometryWatchers, "Instanced geometry");
    assertDisposedOnce(materialWatchers, "Instanced material");
    assertDisposedOnce(textureWatchers, "Instanced texture");
    assertEqual(token.visible, false);
  });

  harness.test("performance acceptance limits remain centralized", () => {
    const acceptance = GAME_CONFIG.performanceAcceptance;

    assertEqual(acceptance.minimumFps, 30);
    assert(
      acceptance.maximumDrawCalls >= 22,
      "Draw-call limit must retain the established scene baseline."
    );
    assert(
      acceptance.maximumTriangles >= 16302,
      "Triangle limit must retain the established scene baseline."
    );
  });
}
