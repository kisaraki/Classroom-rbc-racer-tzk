export class EventBus {
  #listeners = new Map();

  on(eventName, listener) {
    if (typeof listener !== "function") {
      throw new TypeError("listener must be a function.");
    }

    const listeners = this.#listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(eventName, listeners);

    return () => this.off(eventName, listener);
  }

  once(eventName, listener) {
    const unsubscribe = this.on(eventName, (...args) => {
      unsubscribe();
      listener(...args);
    });

    return unsubscribe;
  }

  off(eventName, listener) {
    const listeners = this.#listeners.get(eventName);

    if (!listeners) {
      return false;
    }

    const removed = listeners.delete(listener);

    if (listeners.size === 0) {
      this.#listeners.delete(eventName);
    }

    return removed;
  }

  emit(eventName, ...args) {
    const listeners = this.#listeners.get(eventName);

    if (!listeners) {
      return 0;
    }

    const snapshot = [...listeners];
    snapshot.forEach((listener) => listener(...args));
    return snapshot.length;
  }

  listenerCount(eventName) {
    return this.#listeners.get(eventName)?.size ?? 0;
  }

  clear(eventName) {
    if (eventName === undefined) {
      this.#listeners.clear();
      return;
    }

    this.#listeners.delete(eventName);
  }
}
