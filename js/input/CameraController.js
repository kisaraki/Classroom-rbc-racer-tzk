import {
  Euler,
  Matrix4,
  Quaternion,
  Vector3
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

export class CameraController {
  #targetElement;
  #document;
  #yaw = 0;
  #pitch = 0;
  #attached = false;
  #baseMatrix = new Matrix4();
  #baseQuaternion = new Quaternion();
  #viewQuaternion = new Quaternion();
  #viewEuler = new Euler(0, 0, 0, "YXZ");
  #cameraPosition = new Vector3();
  #backward = new Vector3();

  constructor({
    targetElement,
    documentRef = globalThis.document
  }) {
    if (!targetElement) {
      throw new TypeError("targetElement is required.");
    }

    this.#targetElement = targetElement;
    this.#document = documentRef;
  }

  get yaw() {
    return this.#yaw;
  }

  get pitch() {
    return this.#pitch;
  }

  attach() {
    if (this.#attached || !this.#document) {
      return false;
    }

    this.#document.addEventListener("mousemove", this.#handleMouseMove);
    this.#attached = true;
    return true;
  }

  detach() {
    if (!this.#attached) {
      return false;
    }

    this.#document.removeEventListener("mousemove", this.#handleMouseMove);
    this.#attached = false;
    return true;
  }

  applyMouseDelta(movementX, movementY) {
    if (!Number.isFinite(movementX) || !Number.isFinite(movementY)) {
      throw new TypeError("Mouse movement must be finite.");
    }

    this.#yaw -= movementX * GAME_CONFIG.camera.mouseSensitivity;
    this.#pitch -= movementY * GAME_CONFIG.camera.mouseSensitivity;
    this.#pitch = Math.min(
      GAME_CONFIG.camera.pitchLimitRadians,
      Math.max(-GAME_CONFIG.camera.pitchLimitRadians, this.#pitch)
    );
  }

  reset() {
    this.#yaw = 0;
    this.#pitch = 0;
  }

  updateCamera(camera, frame, lateralX, lateralY) {
    this.#cameraPosition
      .copy(frame.point)
      .addScaledVector(frame.right, lateralX)
      .addScaledVector(frame.up, lateralY);
    camera.position.copy(this.#cameraPosition);

    this.#backward.copy(frame.tangent).negate();
    this.#baseMatrix.makeBasis(
      frame.right,
      frame.up,
      this.#backward
    );
    this.#baseQuaternion.setFromRotationMatrix(this.#baseMatrix);
    this.#viewEuler.set(this.#pitch, this.#yaw, 0, "YXZ");
    this.#viewQuaternion.setFromEuler(this.#viewEuler);
    camera.quaternion
      .copy(this.#baseQuaternion)
      .multiply(this.#viewQuaternion);
  }

  #handleMouseMove = (event) => {
    if (this.#document.pointerLockElement !== this.#targetElement) {
      return;
    }

    this.applyMouseDelta(event.movementX, event.movementY);
  };
}
