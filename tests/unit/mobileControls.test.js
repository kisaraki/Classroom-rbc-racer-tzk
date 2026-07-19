import { InputController } from "../../js/input/InputController.js?v=stable-v1.1-20260715-r2";
import {
  isLandscapeViewport,
  MobileControls
} from "../../js/input/MobileControls.js?v=stable-v1.1-20260715-r2";
import {
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
    event.currentTarget = this;
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

class FakeElement extends FakeEventTarget {
  dataset = {};
  hidden = true;
  fullscreenRequests = 0;

  setPointerCapture() {}

  async requestFullscreen() {
    this.fullscreenRequests += 1;
  }
}

function createFixture({ landscape = true } = {}) {
  const root = new FakeElement();
  const controlsElement = new FakeElement();
  const orientationGuard = new FakeElement();
  const pauseButton = new FakeElement();
  const holdButtons = [
    ["ArrowUp", new FakeElement()],
    ["ArrowDown", new FakeElement()],
    ["ArrowLeft", new FakeElement()],
    ["ArrowRight", new FakeElement()],
    ["KeyZ", new FakeElement()],
    ["KeyX", new FakeElement()]
  ].map(([code, button]) => {
    button.dataset.mobileHoldCode = code;
    return button;
  });
  const qteButtons = [
    ["KeyO", new FakeElement()],
    ["KeyC", new FakeElement()]
  ].map(([code, button]) => {
    button.dataset.mobileQteCode = code;
    return button;
  });
  const elements = new Map([
    ["#mobile-controls", controlsElement],
    ["#mobile-orientation-guard", orientationGuard],
    ["#mobile-pause-control", pauseButton]
  ]);
  const orientation = new FakeEventTarget();
  orientation.lockRequests = [];
  orientation.lock = async (mode) => {
    orientation.lockRequests.push(mode);
  };
  const windowRef = new FakeEventTarget();
  windowRef.innerWidth = landscape ? 800 : 390;
  windowRef.innerHeight = landscape ? 390 : 800;
  windowRef.matchMedia = () => ({ matches: landscape });
  windowRef.screen = { orientation };
  const documentRef = {
    fullscreenElement: null,
    querySelector: (selector) => elements.get(selector) ?? null,
    querySelectorAll: (selector) => selector === "[data-mobile-hold-code]"
      ? holdButtons
      : selector === "[data-mobile-qte-code]"
        ? qteButtons
        : []
  };

  return {
    root,
    controlsElement,
    orientationGuard,
    pauseButton,
    holdButtons,
    qteButtons,
    orientation,
    windowRef,
    documentRef,
    setLandscape(value) {
      landscape = value;
      windowRef.innerWidth = value ? 800 : 390;
      windowRef.innerHeight = value ? 390 : 800;
    }
  };
}

function pointerEvent(pointerId) {
  return {
    pointerId,
    button: 0,
    preventDefault() {}
  };
}

export function registerMobileControlsTests(harness) {
  harness.test("landscape detection uses media query then viewport fallback", () => {
    assertEqual(
      isLandscapeViewport({
        matchMedia: () => ({ matches: true }),
        innerWidth: 300,
        innerHeight: 800
      }),
      true
    );
    assertEqual(
      isLandscapeViewport({
        innerWidth: 300,
        innerHeight: 800
      }),
      false
    );
  });

  harness.test("touch controls support held movement and rapid QTE input", () => {
    const fixture = createFixture();
    const input = new InputController({ target: null });
    const mobile = new MobileControls({
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      rootElement: fixture.root,
      input
    });

    mobile.attach();
    assertEqual(fixture.controlsElement.hidden, false);
    assertEqual(fixture.orientationGuard.hidden, true);

    fixture.holdButtons[0].emit("pointerdown", pointerEvent(1));
    fixture.holdButtons[3].emit("pointerdown", pointerEvent(2));
    assertEqual(input.getLateralAxes().x > 0, true);
    assertEqual(input.getLateralAxes().y > 0, true);
    fixture.holdButtons[0].emit("pointerup", pointerEvent(1));
    fixture.holdButtons[3].emit("pointerup", pointerEvent(2));
    assertEqual(input.getLateralAxes().x, 0);
    assertEqual(input.getLateralAxes().y, 0);

    fixture.qteButtons[0].emit("pointerdown", pointerEvent(3));
    fixture.qteButtons[0].emit("pointerup", pointerEvent(3));
    fixture.qteButtons[1].emit("pointerdown", pointerEvent(4));
    assertEqual(input.consumeQteActions().join(" "), "KeyO KeyC");
    mobile.detach();
  });

  harness.test("portrait gate releases held controls and reports transitions", () => {
    const fixture = createFixture({ landscape: false });
    const input = new InputController({ target: null });
    const orientations = [];
    const mobile = new MobileControls({
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      rootElement: fixture.root,
      input,
      onOrientationChange: (value) => orientations.push(value)
    });

    mobile.attach();
    assertEqual(fixture.orientationGuard.hidden, false);
    assertEqual(fixture.root.dataset.mobileOrientation, "PORTRAIT");
    fixture.setLandscape(true);
    fixture.windowRef.emit("resize");
    assertEqual(fixture.orientationGuard.hidden, true);
    assertEqual(fixture.root.dataset.mobileOrientation, "LANDSCAPE");
    assertEqual(orientations.join(" "), "false true");
    mobile.detach();
  });

  harness.test("mobile pause callback and orientation lock stay optional", async () => {
    const fixture = createFixture();
    const input = new InputController({ target: null });
    let pauses = 0;
    const mobile = new MobileControls({
      documentRef: fixture.documentRef,
      windowRef: fixture.windowRef,
      rootElement: fixture.root,
      input,
      onPause: () => {
        pauses += 1;
      }
    });

    mobile.attach();
    fixture.pauseButton.emit("pointerdown", pointerEvent(1));
    assertEqual(pauses, 1);
    const result = await mobile.requestLandscapeLock();
    assertEqual(result.fullscreenRequested, true);
    assertEqual(result.orientationLocked, true);
    assertEqual(fixture.root.fullscreenRequests, 1);
    assertEqual(fixture.orientation.lockRequests.join(" "), "landscape");
    mobile.detach();
  });
}
