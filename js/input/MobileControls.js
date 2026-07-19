import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function requireElement(root, selector) {
  const element = root?.querySelector?.(selector);

  if (!element) {
    throw new Error("Missing mobile control element: " + selector);
  }

  return element;
}

export function isLandscapeViewport(
  windowRef = globalThis.window,
  config = GAME_CONFIG.mobileControls
) {
  const mediaMatch = windowRef?.matchMedia?.(
    config.landscapeMediaQuery
  );

  if (typeof mediaMatch?.matches === "boolean") {
    return mediaMatch.matches;
  }

  return Number(windowRef?.innerWidth) > Number(windowRef?.innerHeight);
}

export class MobileControls {
  #document;
  #window;
  #root;
  #input;
  #onPause;
  #onOrientationChange;
  #controls;
  #orientationGuard;
  #holdButtons;
  #qteButtons;
  #pauseButton;
  #pointerCodes = new Map();
  #codePointerCounts = new Map();
  #attached = false;
  #lastLandscape = null;

  constructor({
    documentRef = globalThis.document,
    windowRef = globalThis.window,
    rootElement,
    input,
    onPause = () => {},
    onOrientationChange = () => {}
  }) {
    if (!documentRef || !windowRef || !rootElement || !input) {
      throw new Error(
        "MobileControls requires document, window, root, and input."
      );
    }

    if (
      typeof onPause !== "function" ||
      typeof onOrientationChange !== "function"
    ) {
      throw new TypeError("Mobile control callbacks must be functions.");
    }

    this.#document = documentRef;
    this.#window = windowRef;
    this.#root = rootElement;
    this.#input = input;
    this.#onPause = onPause;
    this.#onOrientationChange = onOrientationChange;
    this.#controls = requireElement(documentRef, "#mobile-controls");
    this.#orientationGuard = requireElement(
      documentRef,
      "#mobile-orientation-guard"
    );
    this.#holdButtons = [
      ...documentRef.querySelectorAll("[data-mobile-hold-code]")
    ];
    this.#qteButtons = [
      ...documentRef.querySelectorAll("[data-mobile-qte-code]")
    ];
    this.#pauseButton = requireElement(
      documentRef,
      "#mobile-pause-control"
    );
  }

  get isLandscape() {
    return isLandscapeViewport(this.#window);
  }

  attach() {
    if (this.#attached) {
      return false;
    }

    this.#controls.hidden = false;
    this.#holdButtons.forEach((button) => {
      button.addEventListener("pointerdown", this.#handleHoldStart);
      button.addEventListener("pointerup", this.#handleHoldEnd);
      button.addEventListener("pointercancel", this.#handleHoldEnd);
      button.addEventListener("lostpointercapture", this.#handleHoldEnd);
    });
    this.#qteButtons.forEach((button) => {
      button.addEventListener("pointerdown", this.#handleQteStart);
      button.addEventListener("pointerup", this.#handleQteEnd);
      button.addEventListener("pointercancel", this.#handleQteEnd);
      button.addEventListener("lostpointercapture", this.#handleQteEnd);
    });
    this.#pauseButton.addEventListener(
      "pointerdown",
      this.#handlePause
    );
    this.#window.addEventListener("resize", this.#syncOrientation);
    this.#window.addEventListener(
      "orientationchange",
      this.#syncOrientation
    );
    this.#window.screen?.orientation?.addEventListener?.(
      "change",
      this.#syncOrientation
    );
    this.#attached = true;
    this.#syncOrientation();
    return true;
  }

  detach() {
    if (!this.#attached) {
      return false;
    }

    this.reset();
    this.#holdButtons.forEach((button) => {
      button.removeEventListener("pointerdown", this.#handleHoldStart);
      button.removeEventListener("pointerup", this.#handleHoldEnd);
      button.removeEventListener("pointercancel", this.#handleHoldEnd);
      button.removeEventListener("lostpointercapture", this.#handleHoldEnd);
    });
    this.#qteButtons.forEach((button) => {
      button.removeEventListener("pointerdown", this.#handleQteStart);
      button.removeEventListener("pointerup", this.#handleQteEnd);
      button.removeEventListener("pointercancel", this.#handleQteEnd);
      button.removeEventListener("lostpointercapture", this.#handleQteEnd);
    });
    this.#pauseButton.removeEventListener(
      "pointerdown",
      this.#handlePause
    );
    this.#window.removeEventListener("resize", this.#syncOrientation);
    this.#window.removeEventListener(
      "orientationchange",
      this.#syncOrientation
    );
    this.#window.screen?.orientation?.removeEventListener?.(
      "change",
      this.#syncOrientation
    );
    this.#controls.hidden = true;
    this.#orientationGuard.hidden = true;
    this.#attached = false;
    return true;
  }

  reset() {
    this.#codePointerCounts.forEach((_count, code) => {
      this.#input.releaseControl(code);
    });
    this.#pointerCodes.clear();
    this.#codePointerCounts.clear();
    [...this.#holdButtons, ...this.#qteButtons].forEach((button) => {
      button.dataset.pressed = "false";
    });
  }

  async requestLandscapeLock() {
    let fullscreenRequested = false;
    let orientationLocked = false;
    const config = GAME_CONFIG.mobileControls;

    if (
      config.requestFullscreenForOrientationLock &&
      !this.#document.fullscreenElement &&
      typeof this.#root.requestFullscreen === "function"
    ) {
      try {
        await this.#root.requestFullscreen();
        fullscreenRequested = true;
      } catch {
        fullscreenRequested = false;
      }
    }

    const orientation = this.#window.screen?.orientation;

    if (typeof orientation?.lock === "function") {
      try {
        await orientation.lock(config.orientationLockType);
        orientationLocked = true;
      } catch {
        orientationLocked = false;
      }
    }

    return Object.freeze({
      fullscreenRequested,
      orientationLocked
    });
  }

  #handleHoldStart = (event) => {
    if (Number.isFinite(event.button) && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const button = event.currentTarget;
    const code = button.dataset.mobileHoldCode;
    const pointerId = event.pointerId ?? "touch";

    if (!code || this.#pointerCodes.has(pointerId)) {
      return;
    }

    button.setPointerCapture?.(pointerId);
    this.#pointerCodes.set(pointerId, code);
    const count = this.#codePointerCounts.get(code) ?? 0;
    this.#codePointerCounts.set(code, count + 1);
    button.dataset.pressed = "true";

    if (count === 0) {
      this.#input.pressControl(code);
    }
  };

  #handleHoldEnd = (event) => {
    const pointerId = event.pointerId ?? "touch";
    const code = this.#pointerCodes.get(pointerId);

    if (!code) {
      return;
    }

    event.preventDefault();
    this.#pointerCodes.delete(pointerId);
    const count = Math.max(
      0,
      (this.#codePointerCounts.get(code) ?? 1) - 1
    );

    if (count === 0) {
      this.#codePointerCounts.delete(code);
      this.#input.releaseControl(code);
      this.#holdButtons
        .filter((button) => button.dataset.mobileHoldCode === code)
        .forEach((button) => {
          button.dataset.pressed = "false";
        });
    } else {
      this.#codePointerCounts.set(code, count);
    }
  };

  #handleQteStart = (event) => {
    if (Number.isFinite(event.button) && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const button = event.currentTarget;
    const code = button.dataset.mobileQteCode;
    button.dataset.pressed = "true";
    button.setPointerCapture?.(event.pointerId);
    this.#input.queueQteAction(code);
  };

  #handleQteEnd = (event) => {
    event.preventDefault();
    event.currentTarget.dataset.pressed = "false";
  };

  #handlePause = (event) => {
    event.preventDefault();
    this.reset();
    this.#onPause();
  };

  #syncOrientation = () => {
    const landscape = this.isLandscape;
    this.#root.dataset.mobileOrientation = landscape
      ? "LANDSCAPE"
      : "PORTRAIT";
    this.#orientationGuard.hidden = landscape;

    if (!landscape) {
      this.reset();
    }

    if (landscape !== this.#lastLandscape) {
      this.#lastLandscape = landscape;
      this.#onOrientationChange(landscape);
    }
  };
}
