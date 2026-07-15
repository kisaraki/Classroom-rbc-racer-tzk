import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function requireElement(root, selector) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error("Missing message element: " + selector);
  }

  return element;
}

function currentTimeMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function getMessageRemainingSeconds(expiresAtMs, nowMs) {
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs)) {
    throw new TypeError("Message deadlines require finite timestamps.");
  }

  return Math.max(
    0,
    (expiresAtMs - nowMs) / GAME_CONFIG.timing.millisecondsPerSecond
  );
}

export class MessageOverlay {
  #elements;
  #expiresAtMs = null;

  constructor(root = globalThis.document) {
    this.#elements = {
      overlay: requireElement(root, "#central-message"),
      kicker: requireElement(root, "#central-message-kicker"),
      title: requireElement(root, "#central-message-title"),
      copy: requireElement(root, "#central-message-copy")
    };
  }

  get isVisible() {
    return !this.#elements.overlay.hidden;
  }

  get expiresAtMs() {
    return this.#expiresAtMs;
  }

  show({
    kicker,
    title,
    copy = "",
    tone = "INFO",
    durationSeconds = GAME_CONFIG.hud.messageDefaultDurationSeconds,
    nowMs = currentTimeMs()
  }) {
    if (!Number.isFinite(nowMs)) {
      throw new TypeError("Message start time must be finite.");
    }

    if (
      durationSeconds !== null &&
      (!Number.isFinite(durationSeconds) || durationSeconds < 0)
    ) {
      throw new RangeError("Message duration must be null or non-negative.");
    }

    this.#elements.kicker.textContent = kicker;
    this.#elements.title.textContent = title;
    this.#elements.copy.textContent = copy;
    this.#elements.copy.hidden = copy.length === 0;
    this.#elements.overlay.dataset.tone = tone;
    this.#elements.overlay.hidden = false;
    this.#expiresAtMs =
      durationSeconds === null
        ? null
        : nowMs +
          durationSeconds * GAME_CONFIG.timing.millisecondsPerSecond;
    this.update(nowMs);
  }

  update(nowMs = currentTimeMs()) {
    if (!this.isVisible || this.#expiresAtMs === null) {
      return null;
    }

    const remainingSeconds = getMessageRemainingSeconds(
      this.#expiresAtMs,
      nowMs
    );

    this.#elements.overlay.dataset.remainingSeconds =
      remainingSeconds.toFixed(GAME_CONFIG.hud.messageTimePrecision);

    if (remainingSeconds === 0) {
      this.hide();
    }

    return remainingSeconds;
  }

  hide() {
    this.#elements.overlay.hidden = true;
    this.#elements.overlay.dataset.remainingSeconds = "";
    this.#expiresAtMs = null;
  }
}
