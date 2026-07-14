import { GAME_CONFIG } from "../config.js";

function requireElement(root, selector) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error("Missing HUD element: " + selector);
  }

  return element;
}

export class HUDManager {
  #elements;

  constructor(root = document) {
    this.#elements = {
      hud: requireElement(root, "#game-hud"),
      hpValue: requireElement(root, "#hp-value"),
      hpMeter: requireElement(root, "#hp-meter"),
      bpValue: requireElement(root, "#bp-value"),
      bpMeter: requireElement(root, "#bp-meter"),
      scoreValue: requireElement(root, "#score-value"),
      locationValue: requireElement(root, "#location-value"),
      speedValue: requireElement(root, "#speed-value"),
      distanceValue: requireElement(root, "#distance-value"),
      clockCard: requireElement(root, ".clock-card"),
      timerValue: requireElement(root, "#timer-value"),
      timerCaption: requireElement(root, "#timer-caption"),
      stateValue: requireElement(root, "#state-value"),
      fpsValue: requireElement(root, "#fps-value"),
      pointerValue: requireElement(root, "#pointer-value"),
      overlay: requireElement(root, "#game-overlay"),
      overlayKicker: requireElement(root, "#overlay-kicker"),
      overlayTitle: requireElement(root, "#overlay-title"),
      overlayCopy: requireElement(root, "#overlay-copy"),
      overlayAction: requireElement(root, "#overlay-action")
    };
  }

  get actionElement() {
    return this.#elements.overlayAction;
  }

  update({
    hp,
    maxHp,
    bp,
    score,
    location,
    speed,
    distance,
    trackLength,
    realClockElapsedSeconds,
    state,
    fps,
    pointerLocked
  }) {
    const valuePrecision = GAME_CONFIG.hud.valuePrecision;
    const hpRatio = Math.min(1, Math.max(0, hp / maxHp));
    const bpRatio = Math.min(
      1,
      Math.max(
        0,
        (bp - GAME_CONFIG.bp.min) /
          (GAME_CONFIG.bp.max - GAME_CONFIG.bp.min)
      )
    );

    this.#elements.hpValue.textContent =
      hp.toFixed(valuePrecision) + " / " + maxHp.toFixed(valuePrecision);
    this.#elements.hpMeter.style.setProperty(
      "--meter-fill",
      String(hpRatio)
    );
    this.#elements.bpValue.textContent =
      bp.toFixed(valuePrecision) + " mmHg";
    this.#elements.bpMeter.style.setProperty(
      "--meter-fill",
      String(bpRatio)
    );
    this.#elements.bpMeter.dataset.range =
      bp < GAME_CONFIG.bp.safeMin
        ? "LOW"
        : bp > GAME_CONFIG.bp.safeMax
          ? "HIGH"
          : "SAFE";
    this.#elements.scoreValue.textContent = score.toFixed(valuePrecision);
    this.#elements.locationValue.textContent = location;
    this.#elements.speedValue.textContent =
      speed.toFixed(valuePrecision) + " u/s";
    this.#elements.distanceValue.textContent =
      distance.toFixed(GAME_CONFIG.hud.distancePrecision) +
      " / " +
      trackLength.toFixed(GAME_CONFIG.hud.distancePrecision);
    this.#elements.timerValue.textContent =
      realClockElapsedSeconds === null
        ? "--.- s"
        : "T+" + realClockElapsedSeconds.toFixed(
            GAME_CONFIG.hud.timerPrecision
          ) + " s";
    this.#elements.clockCard.dataset.active = String(
      realClockElapsedSeconds !== null
    );
    this.#elements.timerCaption.textContent =
      realClockElapsedSeconds === null
        ? "STARTS ON CLICK"
        : "CONTINUES IN PAUSE";
    this.#elements.stateValue.textContent = state;
    this.#elements.fpsValue.textContent =
      fps.toFixed(GAME_CONFIG.hud.fpsPrecision);
    this.#elements.pointerValue.textContent = pointerLocked
      ? "LOCKED"
      : "RELEASED";
    this.#elements.hud.dataset.state = state;
  }

  showReady() {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "READY";
    this.#elements.overlayKicker.textContent = "Phase 01 / Driving prototype";
    this.#elements.overlayTitle.textContent = "進入血流";
    this.#elements.overlayCopy.textContent =
      "本原型用於驗證紅血球駕駛與血液循環介面，不構成醫療建議。方向鍵在血管截面移動，Z／X 調整血壓；滑鼠只改變視角。";
    this.#elements.overlayAction.textContent =
      "開始遊戲並鎖定滑鼠視角";
    this.#elements.overlayAction.disabled = false;
  }

  showPaused() {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "PAUSED";
    this.#elements.overlayKicker.textContent = "World simulation stopped";
    this.#elements.overlayTitle.textContent = "點擊恢復遊戲";
    this.#elements.overlayCopy.textContent =
      "血管中的世界位移已停止；右上角 REAL CLOCK 仍依絕對時間繼續。";
    this.#elements.overlayAction.textContent = "點擊恢復遊戲";
    this.#elements.overlayAction.disabled = false;
  }

  hideOverlay() {
    this.#elements.overlay.hidden = true;
  }

  showPointerLockError(message) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "ERROR";
    this.#elements.overlayKicker.textContent = "Pointer Lock unavailable";
    this.#elements.overlayTitle.textContent = "無法鎖定滑鼠";
    this.#elements.overlayCopy.textContent = message;
    this.#elements.overlayAction.textContent = "重試滑鼠鎖定";
    this.#elements.overlayAction.disabled = false;
  }
}
