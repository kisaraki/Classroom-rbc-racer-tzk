import { GAME_CONFIG } from "../config.js?v=phase05-bp-reflection";
import { MessageOverlay } from "./MessageOverlay.js?v=phase05-bp-reflection";
import { MiniMapRenderer } from "./MiniMapRenderer.js?v=phase05-bp-reflection";

const EMPTY_STATUSES = Object.freeze([]);

function requireElement(root, selector) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error("Missing HUD element: " + selector);
  }

  return element;
}

export class HUDManager {
  #elements;
  #minimap;
  #messageOverlay;
  #statusElements = new Map();

  constructor(root = document) {
    this.#elements = {
      hud: requireElement(root, "#game-hud"),
      hpValue: requireElement(root, "#hp-value"),
      hpMeter: requireElement(root, "#hp-meter"),
      bpValue: requireElement(root, "#bp-value"),
      bpMeter: requireElement(root, "#bp-meter"),
      scoreValue: requireElement(root, "#score-value"),
      levelValue: requireElement(root, "#level-value"),
      locationValue: requireElement(root, "#location-value"),
      speedValue: requireElement(root, "#speed-value"),
      distanceValue: requireElement(root, "#distance-value"),
      clockCard: requireElement(root, ".clock-card"),
      timerValue: requireElement(root, "#timer-value"),
      timerCaption: requireElement(root, "#timer-caption"),
      stateValue: requireElement(root, "#state-value"),
      fpsValue: requireElement(root, "#fps-value"),
      pointerValue: requireElement(root, "#pointer-value"),
      statusPanel: requireElement(root, "#status-panel"),
      statusList: requireElement(root, "#status-list"),
      statusEmpty: requireElement(root, "#status-empty"),
      overlay: requireElement(root, "#game-overlay"),
      overlayKicker: requireElement(root, "#overlay-kicker"),
      overlayTitle: requireElement(root, "#overlay-title"),
      overlayCopy: requireElement(root, "#overlay-copy"),
      overlayAction: requireElement(root, "#overlay-action")
    };
    this.#minimap = new MiniMapRenderer(root);
    this.#messageOverlay = new MessageOverlay(root);
  }

  get actionElement() {
    return this.#elements.overlayAction;
  }

  get minimapDiagnostics() {
    return Object.freeze({
      nodeCount: this.#minimap.nodeCount,
      vesselCount: this.#minimap.vesselCount,
      routeId: this.#minimap.currentRouteId,
      progress: this.#minimap.progress
    });
  }

  update({
    hp,
    maxHp,
    bp,
    score,
    level,
    levelCount,
    location,
    speed,
    distance,
    trackLength,
    realClockElapsedSeconds,
    state,
    fps,
    pointerLocked,
    minimapPathId,
    minimapProgress,
    clockNowMs,
    statuses = EMPTY_STATUSES
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
    this.#elements.levelValue.textContent = level + " / " + levelCount;
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
    this.#minimap.update(minimapPathId, minimapProgress);
    this.#updateStatuses(statuses, clockNowMs);
    this.#messageOverlay.update(clockNowMs);
  }

  showMessage(message) {
    this.#messageOverlay.show(message);
  }

  hideMessage() {
    this.#messageOverlay.hide();
  }

  showReady() {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "READY";
    this.#elements.overlayKicker.textContent = "Phase 05 / Blood pressure hazards";
    this.#elements.overlayTitle.textContent = "血壓風險上線";
    this.#elements.overlayCopy.textContent =
      "高血壓會依每秒公式形成 Wound；低於 80 BP 可能停滯五秒，請按 Z 恢復血壓。RBC 車身也會隨所在血管的程序化色彩產生細微反光。";
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

  #updateStatuses(statuses, nowMs) {
    if (!Array.isArray(statuses) || !Number.isFinite(nowMs)) {
      throw new TypeError("HUD statuses require an array and a finite timestamp.");
    }

    const activeIds = new Set();

    statuses.forEach((status) => {
      const remainingSeconds = getStatusRemainingSeconds(
        status.expiresAtMs,
        nowMs
      );

      if (remainingSeconds <= 0) {
        return;
      }

      activeIds.add(status.id);
      let elements = this.#statusElements.get(status.id);

      if (!elements) {
        elements = this.#createStatusElements(status.id);
        this.#statusElements.set(status.id, elements);
        this.#elements.statusList.append(elements.item);
      }

      elements.item.dataset.tone = status.tone ?? "CAUTION";
      elements.label.textContent = status.label;
      elements.remaining.textContent =
        remainingSeconds.toFixed(GAME_CONFIG.hud.statusTimePrecision) + " s";
    });

    this.#statusElements.forEach((elements, statusId) => {
      if (!activeIds.has(statusId)) {
        elements.item.remove();
        this.#statusElements.delete(statusId);
      }
    });

    const count = this.#statusElements.size;
    this.#elements.statusPanel.dataset.active = String(count > 0);
    this.#elements.statusList.dataset.count = String(count);
    this.#elements.statusEmpty.hidden = count > 0;
  }

  #createStatusElements(statusId) {
    const documentRef = this.#elements.statusList.ownerDocument;
    const item = documentRef.createElement("article");
    const label = documentRef.createElement("span");
    const remaining = documentRef.createElement("strong");

    item.className = "status-item";
    item.dataset.statusId = statusId;
    item.append(label, remaining);

    return { item, label, remaining };
  }
}

export function getStatusRemainingSeconds(expiresAtMs, nowMs) {
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs)) {
    throw new TypeError("Status countdowns require finite timestamps.");
  }

  return Math.max(
    0,
    (expiresAtMs - nowMs) / GAME_CONFIG.timing.millisecondsPerSecond
  );
}
