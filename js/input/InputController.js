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

export class InputController {
  #target;
  #pressedCodes = new Set();
  #drivingActions = [];
  #qteActions = [];
  #attached = false;

  constructor({ target = globalThis.window } = {}) {
    this.#target = target;
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

  #handleKeyDown = (event) => {
    if (!CONTROL_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();

    if (
      (event.code === "KeyO" || event.code === "KeyC") &&
      event.repeat
    ) {
      return;
    }

    const wasPressed = this.isPressed(event.code);
    this.setPressed(event.code, true);

    if (
      DRIVING_CONTROL_CODE_SET.has(event.code) &&
      !wasPressed &&
      !event.repeat
    ) {
      this.#drivingActions.push(Object.freeze({
        code: event.code,
        pressed: true
      }));
    }

    if (event.code === "KeyO" || event.code === "KeyC") {
      this.#qteActions.push(event.code);
    }
  };

  #handleKeyUp = (event) => {
    if (!CONTROL_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();
    const wasPressed = this.isPressed(event.code);
    this.setPressed(event.code, false);

    if (DRIVING_CONTROL_CODE_SET.has(event.code) && wasPressed) {
      this.#drivingActions.push(Object.freeze({
        code: event.code,
        pressed: false
      }));
    }
  };

  #handleBlur = () => {
    this.reset();
  };
}
