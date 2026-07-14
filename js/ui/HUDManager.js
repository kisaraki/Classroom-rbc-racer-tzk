import { GAME_CONFIG } from "../config.js?v=phase07-status-r2";
import { MessageOverlay } from "./MessageOverlay.js?v=phase07-status-r2";
import { MiniMapRenderer } from "./MiniMapRenderer.js?v=phase07-status-r2";

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
      qtePanel: requireElement(root, "#qte-panel"),
      qteAttempt: requireElement(root, "#qte-attempt"),
      qteInstruction: requireElement(root, "#qte-instruction"),
      qteOxygenCard: requireElement(root, "#qte-oxygen-card"),
      qteCarbonCard: requireElement(root, "#qte-carbon-card"),
      qteOxygenCount: requireElement(root, "#qte-oxygen-count"),
      qteCarbonCount: requireElement(root, "#qte-carbon-count"),
      qteTimer: requireElement(root, "#qte-timer"),
      qteProgress: requireElement(root, "#qte-progress"),
      qteResult: requireElement(root, "#qte-result"),
      qteResultTitle: requireElement(root, "#qte-result-title"),
      qteResultCopy: requireElement(root, "#qte-result-copy"),
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
    this.#elements.overlayKicker.textContent = "Phase 07 / Status overlap protocol";
    this.#elements.overlayTitle.textContent = "狀態效果上線";
    this.#elements.overlayCopy.textContent =
      "第五次酒精碰撞觸發十五秒中毒；瘧原蟲使引擎蓋翻動五秒。效果可重疊，絕對期限在 QTE、低血壓與暫停中繼續。";
    this.#elements.overlayAction.textContent =
      "開始遊戲並鎖定滑鼠視角";
    this.#elements.overlayAction.hidden = false;
    this.#elements.overlayAction.disabled = false;
  }

  showPaused(pausedFromState = null) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "PAUSED";
    this.#elements.overlayKicker.textContent = "World simulation stopped";
    this.#elements.overlayTitle.textContent = "點擊恢復遊戲";
    this.#elements.overlayCopy.textContent = pausedFromState === "QTE"
      ? "世界位移已停止，但氣體交換與 REAL CLOCK 的絕對倒數仍持續。"
      : pausedFromState === "TRANSFER_CUTSCENE"
        ? "轉場倒數仍持續；完成後會直接顯示第一關結算。"
        : "世界位移已停止；REAL CLOCK、酒精與瘧原蟲的絕對期限及動畫仍繼續。";
    this.#elements.overlayAction.textContent = "點擊恢復遊戲";
    this.#elements.overlayAction.hidden = false;
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
    this.#elements.overlayAction.hidden = false;
    this.#elements.overlayAction.disabled = false;
  }

  updateQte(diagnostics, nowMs) {
    if (!diagnostics || !Number.isFinite(nowMs)) {
      throw new TypeError("QTE HUD requires diagnostics and an absolute time.");
    }

    if (diagnostics.phase === "IDLE") {
      this.hideQte();
      return;
    }

    const isInput = diagnostics.phase === "INPUT";
    const attempt = Math.min(
      GAME_CONFIG.qte.maxAttempts,
      diagnostics.attempts + Number(isInput)
    );
    const deadline = isInput
      ? diagnostics.qteExpiresAtMs
      : diagnostics.resultExpiresAtMs;
    const durationMs = isInput
      ? GAME_CONFIG.qte.durationMs
      : GAME_CONFIG.qte.resultDisplayMs;
    const remainingMs = Math.max(0, deadline - nowMs);
    const progress = Math.min(1, remainingMs / durationMs);

    this.#elements.qtePanel.hidden = false;
    this.#elements.qtePanel.dataset.phase = diagnostics.phase;
    this.#elements.qtePanel.dataset.outcome = diagnostics.lastOutcome ?? "";
    this.#elements.qtePanel.dataset.status = diagnostics.status;
    this.#elements.qteAttempt.textContent =
      "ATTEMPT " + attempt + " / " + GAME_CONFIG.qte.maxAttempts;
    this.#elements.qteInstruction.textContent =
      (
        GAME_CONFIG.qte.durationMs /
        GAME_CONFIG.timing.millisecondsPerSecond
      ).toFixed(1) + " 秒內分別按滿 O 與 C，不必交替。";
    this.#elements.qteOxygenCount.textContent =
      diagnostics.oxygenCount + " / " + diagnostics.oxygenThreshold;
    this.#elements.qteCarbonCount.textContent =
      diagnostics.carbonDioxideCount +
      " / " +
      diagnostics.carbonDioxideThreshold;
    this.#elements.qteOxygenCard.dataset.complete = String(
      diagnostics.oxygenCount >= diagnostics.oxygenThreshold
    );
    this.#elements.qteCarbonCard.dataset.complete = String(
      diagnostics.carbonDioxideCount >=
        diagnostics.carbonDioxideThreshold
    );
    this.#elements.qteTimer.textContent =
      (remainingMs / GAME_CONFIG.timing.millisecondsPerSecond).toFixed(2) +
      " s";
    this.#elements.qteProgress.style.width = progress * 100 + "%";
    this.#elements.qteInstruction.hidden = !isInput;
    this.#elements.qteResult.hidden = isInput;

    if (!isInput) {
      const succeeded = diagnostics.lastOutcome === "SUCCESS";
      const retryAvailable = diagnostics.status === "PENDING";
      this.#elements.qteResultTitle.textContent = succeeded
        ? "交換完成"
        : retryAvailable
          ? "交換不足，再試一次"
          : "交換失敗，允許通過";
      this.#elements.qteResultCopy.textContent = succeeded
        ? "血液已完成氣體交換，血管色彩開始轉換。"
        : retryAvailable
          ? "前方會出現第二個 Gas Token。"
          : "已記錄減分，仍可完成第一關。";
    }
  }

  hideQte() {
    this.#elements.qtePanel.hidden = true;
    this.#elements.qtePanel.dataset.phase = "IDLE";
    this.#elements.qtePanel.dataset.outcome = "";
  }

  showTransfer(gasExchangeStatus) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "TRANSFER";
    this.#elements.overlayKicker.textContent = "Transfer cutscene / Absolute time";
    this.#elements.overlayTitle.textContent = "循環交接中";
    this.#elements.overlayCopy.textContent = gasExchangeStatus === "SUCCESS"
      ? "氣體交換成功，正在將血流資料送往右心室。"
      : "氣體交換未完成，但依規則允許失敗通過並送往右心室。";
    this.#elements.overlayAction.hidden = true;
    this.#elements.overlayAction.disabled = true;
  }

  showLevelComplete({ gasExchangeStatus, score }) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "COMPLETE";
    this.#elements.overlayKicker.textContent = "Level 01 / Route complete";
    this.#elements.overlayTitle.textContent = "第一關完成";
    this.#elements.overlayCopy.textContent =
      (gasExchangeStatus === "SUCCESS"
        ? "氣體交換成功。"
        : "氣體交換失敗，但已依規則通過。") +
      " 最終分數：" +
      score +
      "。Phase 07 僅開放第一關，可重新挑戰。";
    this.#elements.overlayAction.textContent = "重新挑戰第一關";
    this.#elements.overlayAction.hidden = false;
    this.#elements.overlayAction.disabled = false;
  }

  showGameOver(mode) {
    const fellIntoWound = mode === "FALL";
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = fellIntoWound
      ? "GAME_OVER_FALL"
      : "GAME_OVER_RECYCLE";
    this.#elements.overlayKicker.textContent = "Level 01 / Mission failed";
    this.#elements.overlayTitle.textContent = fellIntoWound
      ? "墜入血管破口"
      : "紅血球已回收";
    this.#elements.overlayCopy.textContent = fellIntoWound
      ? "Wound 為致命障礙。將由第一關檢查點重新建立同一組種子與障礙序列。"
      : "HP 已降至零。將以至少 " +
        GAME_CONFIG.checkpoint.retryMinimumHp +
        " HP 從第一關檢查點重新開始。";
    this.#elements.overlayAction.textContent = "從檢查點重試";
    this.#elements.overlayAction.hidden = false;
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
