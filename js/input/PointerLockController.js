function createUnsupportedError() {
  const error = new Error("Pointer Lock API is not supported.");
  error.name = "NotSupportedError";
  return error;
}

export class PointerLockController {
  #document;
  #targetElement;
  #onChange;
  #onError;
  #attached = false;
  #errorReportedForRequest = false;

  constructor({
    documentRef,
    targetElement,
    onChange = () => {},
    onError = () => {}
  }) {
    if (!documentRef || !targetElement) {
      throw new Error(
        "PointerLockController requires a document and target element."
      );
    }

    if (typeof onChange !== "function" || typeof onError !== "function") {
      throw new TypeError("Pointer Lock callbacks must be functions.");
    }

    this.#document = documentRef;
    this.#targetElement = targetElement;
    this.#onChange = onChange;
    this.#onError = onError;
  }

  get isLocked() {
    return this.#document.pointerLockElement === this.#targetElement;
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
    this.#attached = false;
    return true;
  }

  request() {
    this.#errorReportedForRequest = false;

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

  exit() {
    if (
      !this.isLocked ||
      typeof this.#document.exitPointerLock !== "function"
    ) {
      return false;
    }

    this.#document.exitPointerLock();
    return true;
  }

  #reportError(error) {
    if (this.#errorReportedForRequest) {
      return;
    }

    this.#errorReportedForRequest = true;
    this.#onError(error);
  }

  #handlePointerLockChange = () => {
    if (this.isLocked) {
      this.#errorReportedForRequest = false;
    }

    this.#onChange(this.isLocked);
  };

  #handlePointerLockError = (event) => {
    this.#reportError(event);
  };
}
