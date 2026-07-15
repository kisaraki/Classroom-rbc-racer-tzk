import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function createUnsupportedError() {
  const error = new Error("Pointer Lock API is not supported.");
  error.name = "NotSupportedError";
  return error;
}

function createTimeoutError() {
  const error = new Error(
    "The browser did not complete the Pointer Lock request."
  );
  error.name = "TimeoutError";
  return error;
}

function getCurrentTimeMs() {
  const performanceNow = globalThis.performance?.now?.();
  return Number.isFinite(performanceNow) ? performanceNow : Date.now();
}

function requireTimestamp(nowMs) {
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new RangeError("Pointer Lock time must be finite and non-negative.");
  }

  return nowMs;
}

export class PointerLockController {
  #document;
  #targetElement;
  #onChange;
  #onError;
  #attached = false;
  #errorReportedForRequest = false;
  #requestTimeoutMs;
  #requestExpiresAtMs = null;

  constructor({
    documentRef,
    targetElement,
    onChange = () => {},
    onError = () => {},
    requestTimeoutMs = GAME_CONFIG.pointerLock.requestTimeoutMs
  }) {
    if (!documentRef || !targetElement) {
      throw new Error(
        "PointerLockController requires a document and target element."
      );
    }

    if (typeof onChange !== "function" || typeof onError !== "function") {
      throw new TypeError("Pointer Lock callbacks must be functions.");
    }

    if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
      throw new RangeError("Pointer Lock timeout must be positive.");
    }

    this.#document = documentRef;
    this.#targetElement = targetElement;
    this.#onChange = onChange;
    this.#onError = onError;
    this.#requestTimeoutMs = requestTimeoutMs;
  }

  get isLocked() {
    return this.#document.pointerLockElement === this.#targetElement;
  }

  get isRequestPending() {
    return this.#requestExpiresAtMs !== null;
  }

  get requestExpiresAtMs() {
    return this.#requestExpiresAtMs;
  }

  attach() {
    if (this.#attached) {
      return false;
    }

    this.#document.addEventListener(
      "pointerlockchange",
      this.#handlePointerLockChange
    );
    this.#document.addEventListener(
      "pointerlockerror",
      this.#handlePointerLockError
    );
    this.#attached = true;
    return true;
  }

  detach() {
    if (!this.#attached) {
      return false;
    }

    this.#document.removeEventListener(
      "pointerlockchange",
      this.#handlePointerLockChange
    );
    this.#document.removeEventListener(
      "pointerlockerror",
      this.#handlePointerLockError
    );
    this.#requestExpiresAtMs = null;
    this.#attached = false;
    return true;
  }

  request(nowMs = getCurrentTimeMs()) {
    requireTimestamp(nowMs);
    this.#errorReportedForRequest = false;
    this.#requestExpiresAtMs = nowMs + this.#requestTimeoutMs;

    if (typeof this.#targetElement.requestPointerLock !== "function") {
      this.#reportError(createUnsupportedError());
      return Promise.resolve(false);
    }

    try {
      this.#targetElement.focus({ preventScroll: true });
      const request = this.#targetElement.requestPointerLock();

      if (!request || typeof request.then !== "function") {
        return Promise.resolve(true);
      }

      return Promise.resolve(request).then(
        () => true,
        (error) => {
          this.#reportError(error);
          return false;
        }
      );
    } catch (error) {
      this.#reportError(error);
      return Promise.resolve(false);
    }
  }

  update(nowMs) {
    requireTimestamp(nowMs);

    if (!this.isRequestPending) {
      return false;
    }

    if (this.isLocked) {
      this.#requestExpiresAtMs = null;
      this.#onChange(true);
      return false;
    }

    if (nowMs < this.#requestExpiresAtMs) {
      return false;
    }

    this.#reportError(createTimeoutError());
    return true;
  }

  exit() {
    if (
      !this.isLocked ||
      typeof this.#document.exitPointerLock !== "function"
    ) {
      return false;
    }

    this.#requestExpiresAtMs = null;
    this.#document.exitPointerLock();
    return true;
  }

  #reportError(error) {
    if (this.#errorReportedForRequest) {
      return;
    }

    this.#errorReportedForRequest = true;
    this.#requestExpiresAtMs = null;
    this.#onError(error);
  }

  #handlePointerLockChange = () => {
    if (this.isLocked) {
      this.#errorReportedForRequest = false;
      this.#requestExpiresAtMs = null;
    }

    this.#onChange(this.isLocked);
  };

  #handlePointerLockError = (event) => {
    this.#reportError(event);
  };
}
