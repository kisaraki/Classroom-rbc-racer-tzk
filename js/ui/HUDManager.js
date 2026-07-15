import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import { CutsceneRenderer } from "../cutscenes/CutsceneRenderer.js?v=stable-v1.1-20260715-r2";
import { createFlightInstrumentSnapshot } from "./FlightInstrumentModel.js?v=stable-v1.1-20260715-r2";
import { MessageOverlay } from "./MessageOverlay.js?v=stable-v1.1-20260715-r2";
import { MiniMapRenderer } from "./MiniMapRenderer.js?v=stable-v1.1-20260715-r2";

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
  #cutsceneRenderer;
  #statusElements = new Map();
  #instrumentDiagnostics = null;

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
      circulationTitle: requireElement(root, "#circulation-title"),
      circulationRouteCode: requireElement(root, "#circulation-route-code"),
      statusPanel: requireElement(root, "#status-panel"),
      statusList: requireElement(root, "#status-list"),
      statusEmpty: requireElement(root, "#status-empty"),
      flightInstruments: requireElement(root, "#flight-instruments"),
      bodyReticle: requireElement(root, "#body-reticle"),
      viewReticle: requireElement(root, "#view-reticle"),
      attitudeMarker: requireElement(root, "#attitude-marker"),
      attitudeX: requireElement(root, "#attitude-x"),
      attitudeY: requireElement(root, "#attitude-y"),
      altitudeMarker: requireElement(root, "#altitude-marker"),
      altitudeMinimum: requireElement(root, "#altitude-minimum"),
      altitudeMaximum: requireElement(root, "#altitude-maximum"),
      altitudeValue: requireElement(root, "#altitude-value"),
      vesselDiameter: requireElement(root, "#vessel-diameter"),
      viewDirectionNeedle: requireElement(root, "#view-direction-needle"),
      viewHeading: requireElement(root, "#view-heading"),
      viewPitch: requireElement(root, "#view-pitch"),
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
      overlayIndex: requireElement(root, "#overlay-index"),
      overlayKicker: requireElement(root, "#overlay-kicker"),
      overlayTitle: requireElement(root, "#overlay-title"),
      overlayCopy: requireElement(root, "#overlay-copy"),
      overlayAction: requireElement(root, "#overlay-action"),
      overlayRestartAction: requireElement(root, "#overlay-restart-action"),
      overlayMenuAction: requireElement(root, "#overlay-menu-action")
    };
    this.#minimap = new MiniMapRenderer(root);
    this.#messageOverlay = new MessageOverlay(root);
    this.#cutsceneRenderer = new CutsceneRenderer(root);
  }

  get actionElement() {
    return this.#elements.overlayAction;
  }

  get restartActionElement() {
    return this.#elements.overlayRestartAction;
  }

  get menuActionElement() {
    return this.#elements.overlayMenuAction;
  }

  get cutsceneDiagnostics() {
    return Object.freeze({
      visible: this.#cutsceneRenderer.isVisible,
      type: this.#cutsceneRenderer.type
    });
  }

  get minimapDiagnostics() {
    return Object.freeze({
      nodeCount: this.#minimap.nodeCount,
      vesselCount: this.#minimap.vesselCount,
      routeId: this.#minimap.currentRouteId,
      progress: this.#minimap.progress,
      anchorNodeId: this.#minimap.anchorNodeId
    });
  }

  get instrumentDiagnostics() {
    return this.#instrumentDiagnostics;
  }

  update({
    hp,
    maxHp,
    bp,
    bpMaximum = GAME_CONFIG.bp.max,
    score,
    level,
    levelCount,
    circulationLabel,
    routeCode,
    location,
    speed,
    distance,
    trackLength,
    timerRemainingSeconds,
    realClockElapsedSeconds,
    state,
    minimapPathId,
    minimapProgress,
    minimapAnchorNodeId,
    lateralX,
    lateralY,
    collisionRadius,
    vesselRadius,
    viewYaw,
    viewPitch,
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
          (bpMaximum - GAME_CONFIG.bp.min)
      )
    );

    this.#elements.hpValue.textContent =
      hp.toFixed(valuePrecision) + " / " + maxHp.toFixed(valuePrecision);
    this.#elements.hpMeter.style.setProperty(
      "--meter-fill",
      String(hpRatio)
    );
    this.#elements.bpValue.textContent =
      bp.toFixed(valuePrecision) +
      " / " +
      bpMaximum.toFixed(valuePrecision) +
      " mmHg";
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
    this.#elements.circulationTitle.textContent = circulationLabel;
    this.#elements.circulationRouteCode.textContent = routeCode;
    this.#elements.locationValue.textContent = location;
    this.#elements.speedValue.textContent =
      speed.toFixed(valuePrecision) + " u/s";
    this.#elements.distanceValue.textContent =
      distance.toFixed(GAME_CONFIG.hud.distancePrecision) +
      " / " +
      trackLength.toFixed(GAME_CONFIG.hud.distancePrecision);
    this.#elements.timerValue.textContent =
      timerRemainingSeconds === null
        ? "--.- s"
        : timerRemainingSeconds.toFixed(
            GAME_CONFIG.hud.timerPrecision
          ) + " s";
    this.#elements.clockCard.dataset.active = String(
      realClockElapsedSeconds !== null
    );
    this.#elements.timerCaption.textContent =
      realClockElapsedSeconds === null
        ? "點擊開始計時"
        : "暫停時仍繼續計時";
    this.#elements.hud.dataset.state = state;
    this.#updateFlightInstruments({
      lateralX,
      lateralY,
      collisionRadius,
      vesselRadius,
      viewYaw,
      viewPitch
    });
    this.#minimap.update(
      minimapPathId,
      minimapProgress,
      minimapAnchorNodeId
    );
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
    this.#elements.overlayIndex.textContent = "O₂";
    this.#elements.overlayKicker.textContent = "紅血球循環任務";
    this.#elements.overlayTitle.textContent = "血液循環任務啟航";
    this.#elements.overlayCopy.textContent =
      "依序完成四段體循環與肺循環，在時限內抵達並完成氣體交換。";
    this.#elements.overlayAction.textContent =
      "開始遊戲並鎖定滑鼠視角";
    this.#setActions({ primary: true });
  }

  showLevelReady(level) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "READY";
    this.#elements.overlayIndex.textContent =
      String(level.id).padStart(2, "0");
    this.#elements.overlayKicker.textContent =
      "第 " + level.id + " 關準備";
    this.#elements.overlayTitle.textContent = level.name;
    this.#elements.overlayCopy.textContent =
      "前一關已完成，生命與分數已保留。點擊後從 " +
      level.start.locationLabel +
      " 繼續循環。";
    this.#elements.overlayAction.textContent = "繼續並鎖定滑鼠視角";
    this.#setActions({ primary: true });
  }

  showPaused(pausedFromState = null) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "PAUSED";
    this.#elements.overlayKicker.textContent = "遊戲已暫停";
    this.#elements.overlayTitle.textContent = "點擊恢復遊戲";
    this.#elements.overlayCopy.textContent = pausedFromState === "QTE"
      ? "車輛移動已停止，但氣體交換與任務倒數仍持續。"
      : pausedFromState === "TRANSFER_CUTSCENE"
        ? "心房至心室輸送帶仍依絕對時間運行；完成後會自動載入下一關或勝利遊街。"
        : "車輛移動已停止；任務倒數與異常狀態期限仍繼續。";
    this.#elements.overlayAction.textContent = "點擊恢復遊戲";
    this.#setActions({ primary: true });
  }

  hideOverlay() {
    this.#elements.overlay.hidden = true;
  }

  showPointerLockPending() {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "LOADING";
    this.#elements.overlayKicker.textContent = "正在啟動遊戲";
    this.#elements.overlayTitle.textContent = "正在鎖定滑鼠";
    this.#elements.overlayCopy.textContent =
      "請允許瀏覽器的滑鼠鎖定要求；完成後會立即進入血管。";
    this.#elements.overlayAction.textContent = "等待瀏覽器回應";
    this.#setActions({ primary: true });
    this.#elements.overlayAction.disabled = true;
  }

  showPointerLockError(message) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "ERROR";
    this.#elements.overlayKicker.textContent = "滑鼠視角無法啟用";
    this.#elements.overlayTitle.textContent = "無法鎖定滑鼠";
    this.#elements.overlayCopy.textContent = message;
    this.#elements.overlayAction.textContent = "重試滑鼠鎖定";
    this.#setActions({ primary: true });
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
      diagnostics.opportunityCount,
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
      "第 " + attempt + " / " + diagnostics.opportunityCount + " 次";
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
          ? "同一交換區前方仍有 Gas Token；完成任一次即可成功。"
          : "已記錄減分，仍可完成本關。";
    }
  }

  hideQte() {
    this.#elements.qtePanel.hidden = true;
    this.#elements.qtePanel.dataset.phase = "IDLE";
    this.#elements.qtePanel.dataset.outcome = "";
  }

  renderCutscene(snapshot) {
    this.#cutsceneRenderer.render(snapshot);
  }

  hideCutscene() {
    this.#cutsceneRenderer.hide();
  }

  showGameOver({ mode, levelId }) {
    const fellIntoWound = mode === "FALL";
    const stroke = mode === "STROKE";
    const timedOut = mode === "TIMEOUT";
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = timedOut
      ? "GAME_OVER_TIMEOUT"
      : stroke
      ? "GAME_OVER_STROKE"
      : fellIntoWound
        ? "GAME_OVER_FALL"
        : "GAME_OVER_RECYCLE";
    this.#elements.overlayIndex.textContent =
      String(levelId).padStart(2, "0");
    this.#elements.overlayKicker.textContent =
      "第 " + levelId + " 關任務失敗";
    this.#elements.overlayTitle.textContent = timedOut
      ? "時間耗盡"
      : stroke
      ? "中風 / Stroke"
      : fellIntoWound
        ? "Vessel Rupture"
        : "紅血球已回收";
    this.#elements.overlayCopy.textContent = timedOut
      ? "紅血球未能在時限內抵達，已乾扁並送往肝臟工廠回收。"
      : stroke
      ? "腦部血管破口造成中風，請重新挑戰本關。"
      : fellIntoWound
        ? "撞上血管破口會直接衝出血管，請重新挑戰本關。"
        : "HP 已降至零。重試時 HP 至少恢復為 " +
          GAME_CONFIG.checkpoint.retryMinimumHp +
          "，分數回到本關起點。";
    this.#elements.overlayAction.textContent = "重新挑戰本關";
    this.#elements.overlayRestartAction.textContent = "從第一關重新開始";
    this.#elements.overlayMenuAction.textContent = "回到主選單";
    this.#setActions({ primary: true, restart: true, menu: true });
  }

  showVictory(summary) {
    this.#elements.overlay.hidden = false;
    this.#elements.overlay.dataset.mode = "VICTORY";
    this.#elements.overlayIndex.textContent = "O₂";
    this.#elements.overlayKicker.textContent = "四段循環完成 / 任務統計";
    this.#elements.overlayTitle.textContent = "循環任務成功";
    this.#elements.overlayCopy.textContent =
      "分數 " + summary.score +
      " / HP " + summary.hp +
      " / 氣體交換成功 " + summary.gasExchangeSuccessCount +
      " / 血管破口閃避 " + summary.woundDodgedCount +
      " / 總時間 " + summary.elapsedSeconds.toFixed(1) + " 秒。";
    this.#elements.overlayAction.textContent = "從第一關重新開始";
    this.#elements.overlayMenuAction.textContent = "回到主選單";
    this.#setActions({ primary: true, menu: true });
  }

  #setActions({ primary = false, restart = false, menu = false } = {}) {
    this.#elements.overlayAction.hidden = !primary;
    this.#elements.overlayAction.disabled = !primary;
    this.#elements.overlayRestartAction.hidden = !restart;
    this.#elements.overlayRestartAction.disabled = !restart;
    this.#elements.overlayMenuAction.hidden = !menu;
    this.#elements.overlayMenuAction.disabled = !menu;
  }

  #updateFlightInstruments({
    lateralX,
    lateralY,
    collisionRadius,
    vesselRadius,
    viewYaw,
    viewPitch
  }) {
    const snapshot = createFlightInstrumentSnapshot({
      lateralX,
      lateralY,
      collisionRadius,
      vesselRadius,
      wallMargin: GAME_CONFIG.track.wallMargin,
      viewYaw,
      viewPitch,
      pitchLimitRadians: GAME_CONFIG.camera.pitchLimitRadians
    });
    const config = GAME_CONFIG.flightInstruments;
    const coordinatePrecision = config.coordinatePrecision;
    const altitudePrecision = config.altitudePrecision;
    const anglePrecision = config.anglePrecision;
    const formatSigned = (value, precision) =>
      (value >= 0 ? "+" : "") + value.toFixed(precision);

    this.#instrumentDiagnostics = snapshot;
    this.#elements.bodyReticle.style.left =
      snapshot.bodyReticleLeftPercent + "%";
    this.#elements.bodyReticle.style.top =
      snapshot.bodyReticleTopPercent + "%";
    this.#elements.viewReticle.style.left =
      snapshot.viewReticleLeftPercent + "%";
    this.#elements.viewReticle.style.top =
      snapshot.viewReticleTopPercent + "%";
    this.#elements.attitudeMarker.style.left =
      (50 + snapshot.attitudeX * config.attitudePanelTravelPercent) + "%";
    this.#elements.attitudeMarker.style.top =
      (50 - snapshot.attitudeY * config.attitudePanelTravelPercent) + "%";
    this.#elements.attitudeX.textContent =
      "X " + formatSigned(lateralX, coordinatePrecision);
    this.#elements.attitudeY.textContent =
      "Y " + formatSigned(lateralY, coordinatePrecision);
    this.#elements.altitudeMarker.style.top =
      (1 - snapshot.altitudeRatio) * 100 + "%";
    this.#elements.altitudeMinimum.textContent =
      snapshot.altitudeMinimum.toFixed(altitudePrecision);
    this.#elements.altitudeMaximum.textContent =
      snapshot.altitudeMaximum.toFixed(altitudePrecision);
    this.#elements.altitudeValue.textContent =
      snapshot.altitude.toFixed(altitudePrecision) + " u";
    this.#elements.vesselDiameter.textContent =
      "DIA " + snapshot.vesselDiameter.toFixed(altitudePrecision);
    this.#elements.viewDirectionNeedle.style.rotate =
      snapshot.headingDegrees + "deg";
    this.#elements.viewHeading.textContent =
      "HDG " +
      String(
        Math.round(snapshot.headingDegrees) % config.fullCircleDegrees
      ).padStart(3, "0") +
      "°";
    this.#elements.viewPitch.textContent =
      "PITCH " + formatSigned(snapshot.pitchDegrees, anglePrecision) + "°";
    this.#elements.flightInstruments.dataset.vesselDiameter =
      snapshot.vesselDiameter.toFixed(altitudePrecision);
    this.#elements.flightInstruments.dataset.heading =
      snapshot.headingDegrees.toFixed(anglePrecision);
  }

  #updateStatuses(statuses, nowMs) {
    if (!Array.isArray(statuses) || !Number.isFinite(nowMs)) {
      throw new TypeError("HUD statuses require an array and a finite timestamp.");
    }

    const activeIds = new Set();

    statuses.forEach((status) => {
      const persistent = status.expiresAtMs === null;
      const remainingSeconds = persistent
        ? null
        : getStatusRemainingSeconds(status.expiresAtMs, nowMs);

      if (!persistent && remainingSeconds <= 0) {
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
      elements.remaining.textContent = persistent
        ? "持續中"
        : remainingSeconds.toFixed(
            GAME_CONFIG.hud.statusTimePrecision
          ) + " s";
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
