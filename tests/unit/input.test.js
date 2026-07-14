import { InputController } from "../../js/input/InputController.js?v=phase06-qte";
import {
  assert,
  assertApproximately,
  assertEqual
} from "./TestHarness.js";

class FakeEventTarget {
  listeners = new Map();

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type, event = {}) {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

export function registerInputTests(harness) {
  harness.test("arrow keys produce local cross-section axes", () => {
    const input = new InputController({ target: null });
    input.setPressed("ArrowRight", true);
    input.setPressed("ArrowUp", true);

    const axes = input.getLateralAxes();
    assertApproximately(Math.hypot(axes.x, axes.y), 1, Number.EPSILON);
    assert(axes.x > 0 && axes.y > 0);
  });

  harness.test("pressing Z and X together cancels BP adjustment", () => {
    const input = new InputController({ target: null });
    input.setPressed("KeyZ", true);
    input.setPressed("KeyX", true);
    assertEqual(input.getBloodPressureAxis(), 0);

    input.setPressed("KeyX", false);
    assertEqual(input.getBloodPressureAxis(), 1);
  });

  harness.test("low-BP raise-only input ignores X without cancelling Z", () => {
    const input = new InputController({ target: null });
    input.setPressed("KeyZ", true);
    input.setPressed("KeyX", true);

    assertEqual(input.getBloodPressureRaiseAxis(), 1);
    input.setPressed("KeyZ", false);
    assertEqual(input.getBloodPressureRaiseAxis(), 0);
  });

  harness.test("WASD is never accepted as vehicle input", () => {
    const input = new InputController({ target: null });
    assertEqual(input.setPressed("KeyW", true), false);
    assertEqual(input.setPressed("KeyA", true), false);
    assertEqual(input.getLateralAxes().x, 0);
    assertEqual(input.getLateralAxes().y, 0);
  });

  harness.test("controlled event.code values prevent browser defaults", () => {
    const target = new FakeEventTarget();
    const input = new InputController({ target });
    let arrowPrevented = false;
    let wasdPrevented = false;

    input.attach();
    target.emit("keydown", {
      code: "ArrowLeft",
      preventDefault: () => {
        arrowPrevented = true;
      }
    });
    target.emit("keydown", {
      code: "KeyW",
      preventDefault: () => {
        wasdPrevented = true;
      }
    });

    assertEqual(arrowPrevented, true);
    assertEqual(wasdPrevented, false);
    assertEqual(input.getLateralAxes().x, -1);

    target.emit("blur");
    assertEqual(input.getLateralAxes().x, 0);
    input.detach();
  });

  harness.test("QTE input queues O and C once while rejecting key repeat", () => {
    const target = new FakeEventTarget();
    const input = new InputController({ target });
    let preventedCount = 0;
    const emit = (code, repeat = false) => target.emit("keydown", {
      code,
      repeat,
      preventDefault: () => {
        preventedCount += 1;
      }
    });

    input.attach();
    emit("KeyO");
    emit("KeyO", true);
    emit("KeyC");
    assertEqual(preventedCount, 3);
    assertEqual(input.consumeQteActions().join(" "), "KeyO KeyC");
    assertEqual(input.consumeQteActions().length, 0);
    input.detach();
  });
}
