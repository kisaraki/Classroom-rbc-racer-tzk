import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

export const DRIVING_CONTROL_CODES = Object.freeze([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyZ",
  "KeyX"
]);

const DRIVING_CONTROL_CODE_SET = new Set(DRIVING_CONTROL_CODES);
const CONTROL_CODES = new Set([
  ...DRIVING_CONTROL_CODES,
  "KeyO",
  "KeyC"
]);
const VOLUME_CODE_TO_CONTROL = new Map([
  ...GAME_CONFIG.mobileControls.volumeIncreaseCodes.map(
    (code) => [code, "KeyZ"]
  ),
  ...GAME_CONFIG.mobileControls.volumeDecreaseCodes.map(
    (code) => [code, "KeyX"]
  )
]);

export class InputController {
  #target;
  #pressedCodes = new Set();
  #drivingActions = [];
  #qteActions = [];
  #attached = false;
  #useVolumeKeys;

  constructor({
    target = globalThis.window,
    useVolumeKeys = false
  } = {}) {
    this.#target = target;
    this.#useVolumeKeys = useVolumeKeys;
  }

  attach() {
    if (this.#attached || !this.#target) {
      return false;
    }

    this.#target.addEventListener("keydown", this.#handleKeyDown);
    this.#target.addEventListener("keyup", this.#handleKeyUp);
    this.#target.addEventListener("blur", this.#handleBlur);
    this.#attached = true;
    return true;
  }

  detach() {
    if (!this.#attached) {
      return false;
    }

    this.#target.removeEventListener("keydown", this.#handleKeyDown);
    this.#target.removeEventListener("keyup", this.#handleKeyUp);
    this.#target.removeEventListener("blur", this.#handleBlur);
    this.reset();
    this.#attached = false;
    return true;
  }

  setPressed(code, pressed) {
    if (!CONTROL_CODES.has(code)) {
      return false;
    }

    if (pressed) {
      this.#pressedCodes.add(code);
    } else {
      this.#pressedCodes.delete(code);
    }

    return true;
  }

  isPressed(code) {
    return this.#pressedCodes.has(code);
  }

  reset() {
    this.#pressedCodes.clear();
    this.#drivingActions.length = 0;
    this.#qteActions.length = 0;
  }

  resetDrivingControls() {
    DRIVING_CONTROL_CODES.forEach((code) => {
      this.#pressedCodes.delete(code);
    });
    this.#drivingActions.length = 0;
  }

  getPressedDrivingCodes() {
    return DRIVING_CONTROL_CODES.filter((code) => this.isPressed(code));
  }

  consumeDrivingActions() {
    return this.#drivingActions.splice(0);
  }

  getLateralAxes() {
    let x = Number(this.isPressed("ArrowRight")) -
      Number(this.isPressed("ArrowLeft"));
    let y = Number(this.isPressed("ArrowUp")) -
      Number(this.isPressed("ArrowDown"));
    const length = Math.hypot(x, y);

    if (length > 1) {
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  getBloodPressureAxis() {
    return (
      Number(this.isPressed("KeyZ")) -
      Number(this.isPressed("KeyX"))
    );
  }

  getBloodPressureRaiseAxis() {
    return Number(this.isPressed("KeyZ"));
  }

  consumeQteActions() {
    return this.#qteActions.splice(0);
  }

  pressControl(code, { repeat = false } = {}) {
    if (!CONTROL_CODES.has(code)) {
      return false;
    }

    if ((code === "KeyO" || code === "KeyC") && repeat) {
      return true;
    }

    const wasPressed = this.isPressed(code);
    this.setPressed(code, true);

    if (
      DRIVING_CONTROL_CODE_SET.has(code) &&
      !wasPressed &&
      !repeat
    ) {
      this.#drivingActions.push(Object.freeze({
        code,
        pressed: true
      }));
    }

    if (code === "KeyO" || code === "KeyC") {
      this.#qteActions.push(code);
    }

    return true;
  }

  releaseControl(code) {
    if (!CONTROL_CODES.has(code)) {
      return false;
    }

    const wasPressed = this.isPressed(code);
    this.setPressed(code, false);

    if (DRIVING_CONTROL_CODE_SET.has(code) && wasPressed) {
      this.#drivingActions.push(Object.freeze({
        code,
        pressed: false
      }));
    }

    return true;
  }

  queueQteAction(code) {
    if (code !== "KeyO" && code !== "KeyC") {
      return false;
    }

    this.#qteActions.push(code);
    return true;
  }

  #handleKeyDown = (event) => {
    const code = this.#getEventControlCode(event);

    if (!code) {
      return;
    }

    event.preventDefault();
    this.pressControl(code, { repeat: event.repeat === true });
  };

  #handleKeyUp = (event) => {
    const code = this.#getEventControlCode(event);

    if (!code) {
      return;
    }

    event.preventDefault();
    this.releaseControl(code);
  };

  #getEventControlCode(event) {
    const eventCode = event?.code || event?.key || "";

    if (CONTROL_CODES.has(eventCode)) {
      return eventCode;
    }

    return this.#useVolumeKeys
      ? VOLUME_CODE_TO_CONTROL.get(eventCode) ?? null
      : null;
  }

  #handleBlur = () => {
    this.reset();
  };
}
