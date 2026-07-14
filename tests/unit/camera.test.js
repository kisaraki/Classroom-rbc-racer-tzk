import {
  PerspectiveCamera,
  Vector3
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../../js/config.js";
import { CameraController } from "../../js/input/CameraController.js";
import {
  assert,
  assertApproximately,
  assertDeepEqual,
  assertEqual
} from "./TestHarness.js";

class FakeDocument {
  listeners = new Map();
  pointerLockElement = null;

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }

  emit(type, event) {
    this.listeners.get(type)?.(event);
  }
}

function createStraightFrame() {
  return {
    point: new Vector3(0, 0, 0),
    tangent: new Vector3(0, 0, -1),
    right: new Vector3(1, 0, 0),
    up: new Vector3(0, 1, 0)
  };
}

export function registerCameraTests(harness) {
  harness.test("mouse look changes yaw and pitch only", () => {
    const targetElement = {};
    const controller = new CameraController({
      targetElement,
      documentRef: null
    });
    const playerState = {
      distanceAlongTrack: 24,
      lateralX: 1,
      lateralY: -2,
      bp: 100,
      speed: 10
    };
    const before = structuredClone(playerState);

    controller.applyMouseDelta(40, -20);
    assert(controller.yaw !== 0);
    assert(controller.pitch !== 0);
    assertDeepEqual(playerState, before);
  });

  harness.test("camera pitch clamps without flipping", () => {
    const controller = new CameraController({
      targetElement: {},
      documentRef: null
    });
    controller.applyMouseDelta(0, -1000000);
    assertApproximately(
      controller.pitch,
      GAME_CONFIG.camera.pitchLimitRadians,
      Number.EPSILON
    );
  });

  harness.test("pointer movement is ignored until the canvas is locked", () => {
    const documentRef = new FakeDocument();
    const targetElement = {};
    const controller = new CameraController({
      targetElement,
      documentRef
    });
    controller.attach();
    documentRef.emit("mousemove", { movementX: 20, movementY: 0 });
    assertEqual(controller.yaw, 0);

    documentRef.pointerLockElement = targetElement;
    documentRef.emit("mousemove", { movementX: 20, movementY: 0 });
    assert(controller.yaw !== 0);
    controller.detach();
  });

  harness.test("camera follows track frame and applies view rotation", () => {
    const controller = new CameraController({
      targetElement: {},
      documentRef: null
    });
    const camera = new PerspectiveCamera();
    const frame = createStraightFrame();
    const initialDirection = new Vector3();
    const rotatedDirection = new Vector3();

    controller.updateCamera(camera, frame, 2, -1);
    camera.getWorldDirection(initialDirection);
    assertApproximately(camera.position.x, 2, Number.EPSILON);
    assertApproximately(camera.position.y, -1, Number.EPSILON);
    assertApproximately(initialDirection.z, -1, Number.EPSILON);

    controller.applyMouseDelta(100, 0);
    controller.updateCamera(camera, frame, 2, -1);
    camera.getWorldDirection(rotatedDirection);
    assert(rotatedDirection.distanceTo(initialDirection) > 0);
  });

  harness.test("camera reset restores the forward view", () => {
    const controller = new CameraController({
      targetElement: {},
      documentRef: null
    });
    controller.applyMouseDelta(120, -80);

    controller.reset();

    assertEqual(controller.yaw, 0);
    assertEqual(controller.pitch, 0);
  });
}
