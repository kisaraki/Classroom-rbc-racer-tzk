const CONTROL_CODES = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyZ",
  "KeyX",
  "KeyO",
  "KeyC"
]);

export class InputController {
  #target;
  #pressedCodes = new Set();
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
    this.#qteActions.length = 0;
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

    this.setPressed(event.code, true);

    if (event.code === "KeyO" || event.code === "KeyC") {
      this.#qteActions.push(event.code);
    }
  };

  #handleKeyUp = (event) => {
    if (!CONTROL_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();
    this.setPressed(event.code, false);
  };

  #handleBlur = () => {
    this.reset();
  };
}
