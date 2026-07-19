import {
  ACESFilmicToneMapping,
  Color,
  FogExp2,
  HemisphereLight,
  PerspectiveCamera,
  REVISION,
  Scene,
  SpotLight,
  SRGBColorSpace,
  WebGLRenderer
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import {
  CUTSCENE_TYPES,
  CutsceneManager
} from "../cutscenes/CutsceneManager.js?v=stable-v1.1-20260715-r2";
import { ENTITY_TRIGGERS } from "../data/entityTypes.js?v=stable-v1.1-20260715-r2";
import {
  createLevelCheckpoint
} from "../data/schemas.js?v=stable-v1.1-20260715-r2";
import { CameraController } from "../input/CameraController.js?v=stable-v1.1-20260715-r2";
import { InputController } from "../input/InputController.js?v=stable-v1.1-20260715-r2";
import { MobileControls } from "../input/MobileControls.js?v=stable-v1.1-20260715-r2";
import { PointerLockController } from "../input/PointerLockController.js?v=stable-v1.1-20260715-r2";
import { PlayerRBC } from "../player/PlayerRBC.js?v=stable-v1.1-20260715-r2";
import { BloodPressureHazardSystem } from "../systems/BloodPressureSystem.js?v=stable-v1.1-20260715-r2";
import { CollisionSystem } from "../systems/CollisionSystem.js?v=stable-v1.1-20260715-r2";
import { EntityManager } from "../systems/EntityManager.js?v=stable-v1.1-20260715-r2";
import {
  canCompleteLevel,
  QTE_EVENTS,
  QTE_OUTCOMES,
  QTE_PHASES,
  QTESystem
} from "../systems/QTESystem.js?v=stable-v1.1-20260715-r2";
import { StatusEffectManager } from "../systems/StatusEffectManager.js?v=stable-v1.1-20260715-r2";
import { HUDManager } from "../ui/HUDManager.js?v=stable-v1.1-20260715-r2";
import { SeededRandom } from "../utils/SeededRandom.js";
import { ProceduralAssetFactory } from "../world/ProceduralAssetFactory.js?v=stable-v1.1-20260715-r2";
import { VesselTrack } from "../world/VesselTrack.js?v=stable-v1.1-20260715-r2";
import { GameLoop } from "./GameLoop.js";
import { GameSession } from "./GameSession.js?v=stable-v1.1-20260715-r2";
import { GAME_STATES } from "./GameStateMachine.js?v=stable-v1.1-20260715-r2";
import { LevelManager } from "./LevelManager.js?v=stable-v1.1-20260715-r2";
import {
  createLevelStartPlayerState,
  createRetryPlayerState
} from "./RunProgression.js?v=stable-v1.1-20260715-r2";

function requireElement(root, selector) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error("Missing game element: " + selector);
  }

  return element;
}

export class Game {
  #document;
  #window;
  #root;
  #canvas;
  #session;
  #levelCheckpoint;
  #pointerLock;
  #mobileControls = null;
  #isMobile = false;
  #cutsceneManager;
  #runStartedAtMs = null;
  #runCompletedAtMs = null;
  #runTotals = {
    levelsCompleted: 0,
    gasExchangeSuccessCount: 0,
    woundDodgedCount: 0
  };
  #completedLevelIds = new Set();
  #finalSummary = null;
  #levelTransitionCount = 0;
  #cutsceneCompletionCount = 0;
  #pointerLockErrorName = "";
  #pointerLockErrorMessage = "";
  #renderFrameCount = 0;
  #simulationUpdateCount = 0;
  #fpsElapsedSeconds = 0;
  #fpsFrameCount = 0;
  #fps = 0;
  #collisionCount = 0;
  #lastCollisionTypeId = "";
  #fatalTypeId = "";
  #playerDepleted = false;
  #woundSpawnCount = 0;
  #vesselReflectionColor = new Color();
  #started = false;
  #disposed = false;

  constructor({
    documentRef = globalThis.document,
    windowRef = globalThis.window,
    deviceProfile = null
  } = {}) {
    if (!documentRef || !windowRef) {
      throw new Error("Game requires a browser document and window.");
    }

    this.#document = documentRef;
    this.#window = windowRef;
    this.#isMobile = deviceProfile?.isMobile === true;
    this.#root = requireElement(documentRef, "#game-root");
    this.#canvas = requireElement(documentRef, "#game-canvas");
    this.#root.dataset.mobileDevice = String(this.#isMobile);
    this.#root.dataset.inputMode = this.#isMobile
      ? GAME_CONFIG.deviceSupport.mobileInputMode
      : GAME_CONFIG.deviceSupport.desktopInputMode;
    this.#root.style.setProperty(
      "--malaria-steam-blur",
      GAME_CONFIG.malaria.steamBlurPixels + "px"
    );
    this.#root.style.setProperty(
      "--malaria-steam-opacity",
      String(GAME_CONFIG.malaria.steamOpacity)
    );
    this.#root.style.setProperty(
      "--malaria-steam-drift",
      GAME_CONFIG.malaria.steamDriftSeconds + "s"
    );
    this.levelManager = new LevelManager();
    this.level = this.levelManager.currentLevel;
    this.#session = new GameSession({
      durationSeconds: this.level.targetDriveSeconds
    });
    this.hud = new HUDManager(documentRef, {
      isMobile: this.#isMobile
    });
    this.#cutsceneManager = new CutsceneManager();

    this.scene = new Scene();
    this.scene.background = new Color(
      GAME_CONFIG.palette.prototypeBackground
    );
    this.scene.fog = new FogExp2(
      GAME_CONFIG.palette.prototypeFog,
      GAME_CONFIG.vessel.fogDensity
    );
    this.camera = new PerspectiveCamera(
      GAME_CONFIG.camera.fieldOfViewDegrees,
      1,
      GAME_CONFIG.camera.nearClip,
      GAME_CONFIG.camera.farClip
    );
    this.renderer = new WebGLRenderer({
      canvas: this.#canvas,
      antialias: true,
      powerPreference: this.#isMobile ? "default" : "high-performance"
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = GAME_CONFIG.renderer.exposure;

    this.track = new VesselTrack({ level: this.level });
    this.player = new PlayerRBC({
      config: GAME_CONFIG,
      stateOverrides: { currentLevel: this.level.id }
    });
    this.#levelCheckpoint = createLevelCheckpoint(
      this.player.state,
      this.level.seed
    );
    this.qteSystem = new QTESystem({ level: this.level });
    this.assetFactory = new ProceduralAssetFactory({ documentRef });
    this.entityManager = new EntityManager({
      track: this.track,
      level: this.level,
      assetFactory: this.assetFactory
    });
    this.gasToken = this.assetFactory.createGasToken(this.track);
    this.bloodPressureHazards = new BloodPressureHazardSystem({
      levelId: this.level.id,
      random: new SeededRandom(
        (this.level.seed ^
          GAME_CONFIG.bloodPressureHazards.randomSeedSalt) >>>
          0
      )
    });
    this.statusEffects = new StatusEffectManager({
      random: new SeededRandom(
        (this.level.seed ^ GAME_CONFIG.intoxication.randomSeedSalt) >>> 0
      )
    });
    this.collisionSystem = new CollisionSystem();
    this.input = new InputController({
      target: windowRef,
      useVolumeKeys: this.#isMobile
    });
    this.cameraController = new CameraController({
      targetElement: this.#canvas,
      documentRef
    });
    this.#pointerLock = new PointerLockController({
      documentRef,
      targetElement: this.#canvas,
      onChange: this.#handlePointerLockChange,
      onError: this.#handlePointerLockError
    });
    if (this.#isMobile) {
      this.#mobileControls = new MobileControls({
        documentRef,
        windowRef,
        rootElement: this.#root,
        input: this.input,
        onPause: this.#handleMobilePause,
        onOrientationChange: this.#handleMobileOrientationChange
      });
    }

    this.scene.add(this.track.group);
    this.scene.add(this.entityManager.group);
    this.scene.add(this.gasToken.group);
    this.scene.add(this.player.worldGroup);
    this.camera.add(this.player.cockpitGroup);
    this.scene.add(this.camera);
    this.#createLighting();

    const initialFrame = this.track.getFrameAtDistance(
      this.player.state.distanceAlongTrack
    );
    this.player.syncWorldTransform(initialFrame);
    this.#syncGasToken();
    this.entityManager.update(this.player.state, 0);
    this.cameraController.updateCamera(
      this.camera,
      initialFrame,
      this.player.state.lateralX,
      this.player.state.lateralY
    );

    this.loop = new GameLoop({
      updateSimulation: (deltaSeconds) => {
        this.#updateSimulation(deltaSeconds);
      },
      renderFrame: (rawDeltaSeconds) => {
        this.#renderFrame(rawDeltaSeconds);
      },
      isWorldRunning: () => this.#session.isWorldRunning,
      requestFrame: windowRef.requestAnimationFrame.bind(windowRef),
      cancelFrame: windowRef.cancelAnimationFrame.bind(windowRef)
    });

    this.#root.dataset.threeRevision = REVISION;
    this.#root.dataset.currentLevel = String(this.level.id);
    this.#root.dataset.levelName = this.level.name;
    this.#root.dataset.minimapPathId = this.level.minimapPathId;
    this.#root.dataset.minimapNodeCount = String(
      this.hud.minimapDiagnostics.nodeCount
    );
    this.#root.dataset.minimapVesselCount = String(
      this.hud.minimapDiagnostics.vesselCount
    );
    this.#root.dataset.trackStart = String(this.level.start.distance);
    this.#root.dataset.trackEnd = String(this.level.end.distance);
    this.#root.dataset.trackSections = String(this.track.sections.length);
    this.#root.dataset.cachedFrames = String(
      this.track.cachedFrameCount
    );
    this.#root.dataset.independentHood = String(
      this.player.hoodController.group.parent ===
        this.player.cockpitGroup
    );
    this.#root.dataset.playerVisualRadius = String(
      GAME_CONFIG.playerModel.outerRadius
    );
    this.#root.dataset.playerCollisionRadius = String(
      this.player.state.collisionRadius
    );
    this.#root.dataset.rbcLabelWidth = String(
      GAME_CONFIG.playerModel.label.planeWidth
    );
    this.#root.dataset.rbcLabelHeight = String(
      GAME_CONFIG.playerModel.label.planeHeight
    );
    this.#root.dataset.releaseStatus = GAME_CONFIG.app.status;
    this.#root.dataset.releaseVersion = GAME_CONFIG.app.version;
    this.#root.dataset.releaseDate = GAME_CONFIG.app.releaseDate;
    this.#root.dataset.proceduralAssets = "true";
    this.#root.dataset.entityBatchCount = String(
      this.entityManager.batchCount
    );
    this.#root.dataset.entityScheduleCount = String(
      this.entityManager.scheduleCount
    );
    this.#root.dataset.collisionWindow = String(
      GAME_CONFIG.collision.window
    );
    this.#root.dataset.bpCheckInterval = String(
      GAME_CONFIG.bloodPressureHazards.checkIntervalSeconds
    );
    this.#root.dataset.vesselReflection = "true";
    this.#root.dataset.gasTokenProcedural = "true";
    this.#root.dataset.gasTokenPartCount = String(
      this.gasToken.partCount
    );
    this.#root.dataset.checkpointSeed = String(
      this.#levelCheckpoint.seed
    );
    this.#root.dataset.checkpointRbcColorState =
      this.#levelCheckpoint.rbcColorState;
    this.#publishLevelMetadata();
    this.hud.showReady();
    this.#resize();
    this.#renderFrame(0);
  }

  get state() {
    return this.#session.state;
  }

  start() {
    if (this.#started || this.#disposed) {
      return false;
    }

    this.input.attach();
    if (this.#isMobile) {
      this.#mobileControls.attach();
    } else {
      this.cameraController.attach();
      this.#pointerLock.attach();
    }
    this.hud.actionElement.addEventListener(
      "click",
      this.#handlePrimaryAction
    );
    this.hud.restartActionElement.addEventListener(
      "click",
      this.#handleRestartAction
    );
    this.hud.menuActionElement.addEventListener(
      "click",
      this.#handleMenuAction
    );
    this.#document.addEventListener(
      "visibilitychange",
      this.#handleVisibilityChange
    );
    this.#window.addEventListener("resize", this.#resize);
    this.loop.start();
    this.#started = true;
    return true;
  }

  dispose() {
    if (this.#disposed) {
      return;
    }

    this.loop.stop();
    this.input.detach();
    if (this.#isMobile) {
      this.#mobileControls.detach();
    } else {
      this.cameraController.detach();
      this.#pointerLock.detach();
    }
    this.hud.actionElement.removeEventListener(
      "click",
      this.#handlePrimaryAction
    );
    this.hud.restartActionElement.removeEventListener(
      "click",
      this.#handleRestartAction
    );
    this.hud.menuActionElement.removeEventListener(
      "click",
      this.#handleMenuAction
    );
    this.#document.removeEventListener(
      "visibilitychange",
      this.#handleVisibilityChange
    );
    this.#window.removeEventListener("resize", this.#resize);
    this.entityManager.dispose();
    this.track.dispose();
    this.player.dispose();
    this.renderer.dispose();
    this.#disposed = true;
  }

  #createLighting() {
    const lighting = GAME_CONFIG.vessel.lighting;
    const hemisphere = new HemisphereLight(
      GAME_CONFIG.palette.hemisphereSky,
      GAME_CONFIG.palette.hemisphereGround,
      lighting.hemisphereIntensity
    );
    hemisphere.name = "vessel-hemisphere-light";
    this.scene.add(hemisphere);

    const headlight = new SpotLight(
      GAME_CONFIG.palette.headlight,
      lighting.headlightIntensity,
      lighting.headlightDistance,
      lighting.headlightAngleRadians,
      lighting.headlightPenumbra,
      lighting.headlightDecay
    );
    headlight.name = "rbc-headlight";
    headlight.target.position.set(
      0,
      0,
      -lighting.targetDistance
    );
    this.camera.add(headlight);
    this.camera.add(headlight.target);
  }

  #updateSimulation(deltaSeconds) {
    const nowMs = this.#session.nowMs;
    const deadlineBoundDeltaSeconds =
      this.#session.getDeadlineBoundDeltaSeconds(deltaSeconds, nowMs);
    this.#updateStatusEffects(nowMs);
    const drivingInput = this.statusEffects.isIntoxicated
      ? this.statusEffects
      : this.input;
    this.player.update(
      deadlineBoundDeltaSeconds,
      drivingInput,
      this.track
    );

    if (this.#checkForTimeout()) {
      return;
    }

    this.entityManager.update(
      this.player.state,
      deadlineBoundDeltaSeconds
    );
    const collisionResult = this.collisionSystem.resolve(
      this.player.state,
      this.entityManager.activeEntities
    );
    const enteredGameOver = this.#handleCollisionResult(collisionResult);
    this.entityManager.recycleConsumed();
    this.gasToken.update(deadlineBoundDeltaSeconds);
    this.track.update(deadlineBoundDeltaSeconds);
    this.#simulationUpdateCount += 1;

    if (enteredGameOver) {
      return;
    }

    const qteStart = this.qteSystem.tryStart(
      this.player.state.previousDistanceAlongTrack,
      this.player.state.distanceAlongTrack,
      this.#session.nowMs
    );

    if (qteStart && this.#session.enterQte()) {
      this.statusEffects.releaseActiveControls();
      this.input.reset();
      this.gasToken.hide();
      this.player.hoodController.setQteMode(true);
      this.hud.hideMessage();
      return;
    }

    if (
      this.levelManager.isAtEnd(this.player.state.distanceAlongTrack) &&
      canCompleteLevel(this.qteSystem.status)
    ) {
      this.#beginTransfer();
    }
  }

  #renderFrame(rawDeltaSeconds) {
    const clockNowMs = this.#session.nowMs;
    if (!this.#isMobile) {
      this.#pointerLock.update(clockNowMs);
    }
    const timedOut = this.#checkForTimeout();
    this.#updateStatusEffects(clockNowMs);
    if (!timedOut) {
      this.#updateQte(clockNowMs);
    }
    this.#updateCutscene(clockNowMs);
    this.#updateBloodPressureMechanisms(
      rawDeltaSeconds,
      clockNowMs
    );
    const distanceAlongTrack = this.player.state.distanceAlongTrack;
    this.track.getColorAtDistance(
      distanceAlongTrack,
      this.#vesselReflectionColor
    );
    this.player.updateVesselReflection(
      this.#vesselReflectionColor,
      rawDeltaSeconds
    );
    const frame = this.track.getFrameAtDistance(
      distanceAlongTrack
    );
    this.cameraController.updateCamera(
      this.camera,
      frame,
      this.player.state.lateralX,
      this.player.state.lateralY
    );
    this.renderer.render(this.scene, this.camera);
    this.#renderFrameCount += 1;
    this.#updateFps(rawDeltaSeconds);

    const timerRemainingSeconds = this.#session.remainingSeconds;
    const realClockElapsedSeconds = this.#session.elapsedSeconds;
    const pointerLocked = this.#pointerLock.isLocked;
    const currentSection = this.levelManager.getSectionAtDistance(
      distanceAlongTrack
    );
    const minimapProgress =
      this.levelManager.getMinimapProgressAtDistance(distanceAlongTrack);
    const minimapAnchorNodeId =
      this.levelManager.getMinimapAnchorAtDistance(distanceAlongTrack);
    this.player.hoodController.update(clockNowMs);

    this.hud.update({
      hp: this.player.state.hp,
      maxHp: this.player.state.maxHp,
      bp: this.player.state.bp,
      bpMaximum: this.player.bloodPressureMaximum,
      score: this.player.state.score,
      level: this.level.id,
      levelCount: GAME_CONFIG.game.totalLevelCount,
      circulationLabel: this.level.hudLabel,
      routeCode: "第 " + this.level.id + " 關",
      location: this.levelManager.getLocationAtDistance(
        distanceAlongTrack
      ),
      speed: this.player.speed,
      distance: this.player.state.distanceAlongTrack,
      trackLength: this.track.trackLength,
      timerRemainingSeconds,
      realClockElapsedSeconds,
      state: this.#session.state,
      fps: this.#fps,
      pointerLocked,
      minimapPathId: this.level.minimapPathId,
      minimapProgress,
      minimapAnchorNodeId,
      lateralX: this.player.state.lateralX,
      lateralY: this.player.state.lateralY,
      collisionRadius: this.player.state.collisionRadius,
      vesselRadius: currentSection.radius,
      viewYaw: this.cameraController.yaw,
      viewPitch: this.cameraController.pitch,
      clockNowMs,
      statuses: this.#getStatuses(clockNowMs)
    });
    this.#publishDiagnostics(
      timerRemainingSeconds,
      realClockElapsedSeconds,
      pointerLocked,
      currentSection,
      minimapProgress,
      clockNowMs
    );
  }

  #updateQte(nowMs) {
    const isQteState = this.#session.state === GAME_STATES.QTE;
    const isPausedQte =
      this.#session.state === GAME_STATES.PAUSED &&
      this.#session.pausedFromState === GAME_STATES.QTE;
    const actions = this.input.consumeQteActions();

    if (!isQteState && !isPausedQte) {
      if (this.qteSystem.phase === QTE_PHASES.IDLE) {
        this.hud.hideQte();
      }
      return;
    }

    let event = this.qteSystem.update(nowMs);

    if (event) {
      this.#handleQteEvent(event);
    } else if (
      isQteState &&
      this.qteSystem.phase === QTE_PHASES.INPUT
    ) {
      for (const action of actions) {
        event = this.qteSystem.recordAction(action, nowMs);

        if (event) {
          this.#handleQteEvent(event);
        }

        if (event?.type === QTE_EVENTS.OUTCOME) {
          break;
        }
      }
    }

    if (this.qteSystem.phase === QTE_PHASES.IDLE) {
      this.hud.hideQte();
    } else {
      this.hud.updateQte(this.qteSystem.diagnostics, nowMs);
    }
  }

  #handleQteEvent(event) {
    if (event.type === QTE_EVENTS.OUTCOME) {
      this.player.state.score += event.scoreDelta;
      this.player.state.gasExchangeStatus = event.status;
      this.player.state.gasExchangeAttempts = event.attempts;

      if (event.outcome === QTE_OUTCOMES.SUCCESS) {
        this.player.state.qteSuccessCount += 1;
        this.player.completeGasExchange();
      }

      this.track.setGasExchangeStatus(event.status);
      this.#syncGasToken();
      return;
    }

    if (event.type === QTE_EVENTS.RESULT_EXPIRED) {
      this.#session.completeQte();
      this.input.reset();
      this.player.hoodController.setQteMode(false);
      this.hud.hideQte();
      this.#syncGasToken();

      if (this.#session.state === GAME_STATES.PAUSED) {
        this.hud.showPaused(this.#session.pausedFromState);
      }
    }
  }

  #beginTransfer() {
    if (!this.#session.enterTransferCutscene()) {
      return false;
    }

    this.#recordLevelCompletion();
    const nextLevel = this.levelManager.peekNextLevel();
    const snapshot = this.#cutsceneManager.start(
      CUTSCENE_TYPES.TRANSFER,
      this.#session.nowMs,
      {
        levelId: this.level.id,
        nextLevelId: nextLevel?.id ?? null,
        fromChamber: this.level.transfer.fromChamber,
        toChamber: this.level.transfer.toChamber,
        gasExchangeStatus: this.qteSystem.status
      }
    );
    this.statusEffects.releaseActiveControls();
    this.input.reset();
    this.gasToken.hide();
    this.player.hoodController.setQteMode(false);
    this.hud.hideMessage();
    this.hud.hideQte();
    this.hud.hideOverlay();
    this.hud.renderCutscene(snapshot);
    return true;
  }

  #updateCutscene(nowMs) {
    const snapshot = this.#cutsceneManager.update(nowMs);

    if (!snapshot) {
      return;
    }

    this.hud.renderCutscene(snapshot);

    if (!snapshot.completed) {
      return;
    }

    this.#cutsceneManager.finish();
    this.#cutsceneCompletionCount += 1;
    this.hud.hideCutscene();

    if (snapshot.type === CUTSCENE_TYPES.TRANSFER) {
      this.#completeTransfer(nowMs);
      return;
    }

    if (snapshot.type === CUTSCENE_TYPES.VICTORY) {
      this.hud.showVictory(this.#finalSummary);
      return;
    }

    this.hud.showGameOver({
      mode: snapshot.type,
      levelId: this.level.id,
      checkpointSeed: this.#levelCheckpoint.seed
    });
  }

  #completeTransfer(nowMs) {
    const controlsActive = this.#isMobile
      ? (
          this.#mobileControls.isLandscape &&
          this.#session.state !== GAME_STATES.PAUSED
        )
      : this.#pointerLock.isLocked;

    if (!this.#session.completeTransferCutscene()) {
      return false;
    }

    if (!this.levelManager.hasNextLevel) {
      return this.#beginVictory(nowMs);
    }

    const nextLevel = this.levelManager.peekNextLevel();
    const hp = this.player.state.hp;
    const score = this.player.state.score;
    const rbcColorState = this.player.state.rbcColorState;
    const playerState = createLevelStartPlayerState({
      levelId: nextLevel.id,
      hp,
      score,
      rbcColorState
    });
    this.#replaceLevelRuntime({
      levelId: nextLevel.id,
      playerState
    });
    this.#levelTransitionCount += 1;

    if (controlsActive) {
      this.#session.acquirePointerLock();
      this.hud.hideOverlay();
      this.hud.showMessage({
        kicker: "循環路線自動銜接",
        title: "第 " + this.level.id + " 關已載入",
        copy:
          "生命與分數已保留，從 " +
          this.level.start.locationLabel +
          " 繼續循環。",
        tone: "INFO",
        nowMs: this.#session.nowMs
      });
    } else {
      this.hud.showLevelReady(this.level);
    }

    return true;
  }

  #beginVictory(nowMs) {
    if (!this.#session.enterVictory()) {
      return false;
    }

    this.#runCompletedAtMs = nowMs;
    this.#finalSummary = this.#createFinalSummary();
    const snapshot = this.#cutsceneManager.start(
      CUTSCENE_TYPES.VICTORY,
      nowMs,
      { summary: this.#finalSummary }
    );
    this.input.reset();
    this.#clearStatusEffects();
    this.hud.hideOverlay();
    this.hud.renderCutscene(snapshot);
    this.#pointerLock.exit();
    return true;
  }

  #syncGasToken() {
    const nextDistance = this.qteSystem.nextTriggerDistance;

    if (
      this.qteSystem.phase === QTE_PHASES.IDLE &&
      Number.isFinite(nextDistance)
    ) {
      this.gasToken.showAtDistance(nextDistance);
    } else {
      this.gasToken.hide();
    }
  }

  #queueIntoxicatedInput(nowMs) {
    const actions = this.input.consumeDrivingActions();

    if (!this.statusEffects.isIntoxicated) {
      return actions.length;
    }

    actions.forEach((action) => {
      this.statusEffects.queueInput(action, nowMs);
    });
    return actions.length;
  }

  #updateStatusEffects(nowMs) {
    this.#queueIntoxicatedInput(nowMs);
    const result = this.statusEffects.update(
      nowMs,
      this.#session.state
    );

    if (result.bloodRuptureEnded) {
      this.player.setBloodPressureMaximum(GAME_CONFIG.bp.max);

      if (this.#session.state === GAME_STATES.PLAYING) {
        this.hud.showMessage({
          kicker: "狀態解除",
          title: "血球破裂狀態解除",
          copy: "血壓調整上限已恢復。",
          tone: "INFO",
          nowMs
        });
      }
    }

    if (result.bpOverride !== null) {
      this.player.setBloodPressure(result.bpOverride);
    }

    this.player.hoodController.setCombinedEffectMode(
      this.statusEffects.isIntoxicated
    );

    if (!result.ended) {
      return;
    }

    this.player.state.alcoholCount = 0;
    this.input.resetDrivingControls();

    if (this.#session.state === GAME_STATES.PLAYING) {
      this.hud.showMessage({
        kicker: "狀態解除",
        title: "酒精中毒解除",
        copy: "延遲輸入已清除，血壓恢復為 100 mmHg。",
        tone: "INFO",
        nowMs
      });
    }
  }

  #clearStatusEffects() {
    this.statusEffects.reset();
    this.player.state.alcoholCount = 0;
    this.player.state.malariaCount = 0;
    this.player.state.carbonMonoxideCount = 0;
    this.player.setBloodPressureMaximum(GAME_CONFIG.bp.max);
    this.player.setBloodPressure(GAME_CONFIG.bp.initial);
    this.qteSystem.setCarbonMonoxidePoisoned(false);
    this.input.resetDrivingControls();
    this.player.hoodController.reset();
  }

  #updateBloodPressureMechanisms(rawDeltaSeconds, nowMs) {
    const result = this.bloodPressureHazards.update({
      bp: this.player.state.bp,
      nowMs,
      isPlaying: this.#session.state === GAME_STATES.PLAYING
    });

    if (result.stasisExpired) {
      this.#session.completeLowBloodPressureStasis();
      this.hud.hideMessage();
    }

    if (
      result.lowBloodPressureTriggered &&
      this.#session.enterLowBloodPressureStasis()
    ) {
      this.statusEffects.releaseActiveControls();
      this.#showLowBloodPressureWarning(nowMs);
    }

    if (result.woundTriggered) {
      const wound = this.entityManager.spawnWoundAhead(
        this.player.state
      );

      if (wound) {
        this.#woundSpawnCount += 1;
        this.hud.showMessage({
          kicker: "高血壓風險",
          title: "高血壓警告",
          copy: "前方形成血管破口，請立即閃避。",
          tone: "CAUTION",
          nowMs
        });
      }
    }

    if (this.#session.state === GAME_STATES.LOW_BP_STASIS) {
      const pressureInput = this.statusEffects.isIntoxicated
        ? this.statusEffects
        : this.input;
      this.player.adjustBloodPressure(
        pressureInput.getBloodPressureRaiseAxis(),
        Math.min(
          rawDeltaSeconds,
          GAME_CONFIG.timing.maximumSimulationDeltaSeconds
        )
      );
    }
  }

  #updateFps(rawDeltaSeconds) {
    this.#fpsElapsedSeconds += rawDeltaSeconds;
    this.#fpsFrameCount += 1;

    if (
      this.#fpsElapsedSeconds >=
      GAME_CONFIG.timing.fpsSampleWindowSeconds
    ) {
      this.#fps =
        this.#fpsFrameCount / this.#fpsElapsedSeconds;
      this.#fpsElapsedSeconds = 0;
      this.#fpsFrameCount = 0;
    }
  }

  #publishDiagnostics(
    timerRemainingSeconds,
    realClockElapsedSeconds,
    pointerLocked,
    currentSection,
    minimapProgress,
    clockNowMs
  ) {
    const state = this.player.state;
    this.#root.dataset.gameState = this.#session.state;
    this.#root.dataset.pointerLocked = String(pointerLocked);
    this.#root.dataset.pointerLockErrorName = this.#pointerLockErrorName;
    this.#root.dataset.pointerLockErrorMessage = this.#pointerLockErrorMessage;
    this.#root.dataset.pointerLockRequestPending = String(
      this.#pointerLock.isRequestPending
    );
    this.#root.dataset.pointerLockRequestExpiresAt =
      this.#pointerLock.requestExpiresAtMs === null
        ? ""
        : String(this.#pointerLock.requestExpiresAtMs);
    this.#root.dataset.levelSection = currentSection.id;
    this.#root.dataset.location =
      this.levelManager.getLocationAtDistance(state.distanceAlongTrack);
    this.#root.dataset.minimapSegmentId =
      currentSection.minimapSegmentId;
    this.#root.dataset.minimapProgress = minimapProgress.toFixed(
      GAME_CONFIG.hud.minimapProgressPrecision
    );
    this.#root.dataset.atLevelStart = String(
      this.levelManager.isAtStart(state.distanceAlongTrack)
    );
    this.#root.dataset.atLevelEnd = String(
      this.levelManager.isAtEnd(state.distanceAlongTrack)
    );
    this.#root.dataset.distance = state.distanceAlongTrack.toFixed(
      GAME_CONFIG.hud.distancePrecision
    );
    this.#root.dataset.previousDistance =
      state.previousDistanceAlongTrack.toFixed(
        GAME_CONFIG.hud.distancePrecision
      );
    this.#root.dataset.lateralX = state.lateralX.toFixed(
      GAME_CONFIG.hud.distancePrecision
    );
    this.#root.dataset.lateralY = state.lateralY.toFixed(
      GAME_CONFIG.hud.distancePrecision
    );
    this.#root.dataset.bp = state.bp.toFixed(
      GAME_CONFIG.hud.valuePrecision
    );
    this.#root.dataset.bpMaximum = String(
      this.player.bloodPressureMaximum
    );
    this.#root.dataset.speed = this.player.speed.toFixed(
      GAME_CONFIG.hud.valuePrecision
    );
    this.#root.dataset.timerRemaining =
      timerRemainingSeconds === null
        ? ""
        : timerRemainingSeconds.toFixed(
            GAME_CONFIG.hud.timerPrecision
          );
    this.#root.dataset.timerElapsed =
      realClockElapsedSeconds === null
        ? ""
        : realClockElapsedSeconds.toFixed(
            GAME_CONFIG.hud.timerPrecision
          );
    this.#root.dataset.renderFrames = String(this.#renderFrameCount);
    this.#root.dataset.simulationUpdates = String(
      this.#simulationUpdateCount
    );
    this.#root.dataset.fps = this.#fps.toFixed(
      GAME_CONFIG.hud.fpsPrecision
    );
    this.#root.dataset.triangles = String(
      this.renderer.info.render.triangles
    );
    this.#root.dataset.drawCalls = String(
      this.renderer.info.render.calls
    );
    this.#root.dataset.geometries = String(
      this.renderer.info.memory.geometries
    );
    this.#root.dataset.textures = String(
      this.renderer.info.memory.textures
    );
    const nearestEntity = this.entityManager.getNearestAhead(
      state.distanceAlongTrack
    );
    this.#root.dataset.hp = state.hp.toFixed(
      GAME_CONFIG.hud.valuePrecision
    );
    this.#root.dataset.score = state.score.toFixed(
      GAME_CONFIG.hud.valuePrecision
    );
    this.#root.dataset.alcoholCount = String(state.alcoholCount);
    this.#root.dataset.malariaCount = String(state.malariaCount);
    this.#root.dataset.carbonMonoxideCount = String(
      state.carbonMonoxideCount
    );
    const statusDiagnostics = this.statusEffects.diagnostics;
    this.#root.dataset.intoxicated = String(
      statusDiagnostics.intoxicated
    );
    this.#root.dataset.intoxicationStartedAt =
      statusDiagnostics.intoxicationStartedAtMs === null
        ? ""
        : String(statusDiagnostics.intoxicationStartedAtMs);
    this.#root.dataset.intoxicationExpiresAt =
      statusDiagnostics.intoxicationExpiresAtMs === null
        ? ""
        : String(statusDiagnostics.intoxicationExpiresAtMs);
    this.#root.dataset.intoxicationNextBpAt =
      statusDiagnostics.nextBpRandomAtMs === null
        ? ""
        : String(statusDiagnostics.nextBpRandomAtMs);
    this.#root.dataset.intoxicationInputQueue = String(
      statusDiagnostics.inputQueueLength
    );
    this.#root.dataset.intoxicationSway =
      statusDiagnostics.currentSway.toFixed(
        GAME_CONFIG.hud.distancePrecision
      );
    this.#root.dataset.intoxicationFailedInputs = String(
      statusDiagnostics.failedInputCount
    );
    this.#root.dataset.intoxicationDroppedInputs = String(
      statusDiagnostics.droppedInputCount
    );
    this.#root.dataset.intoxicationExecutedInputs = String(
      statusDiagnostics.executedInputCount
    );
    this.#root.dataset.bloodRuptureActive = String(
      statusDiagnostics.bloodRuptureActive
    );
    this.#root.dataset.bloodRuptureExpiresAt =
      statusDiagnostics.bloodRuptureExpiresAtMs === null
        ? ""
        : String(statusDiagnostics.bloodRuptureExpiresAtMs);
    this.#root.dataset.carbonMonoxidePoisoned = String(
      statusDiagnostics.carbonMonoxidePoisoned
    );
    this.#root.dataset.entityActiveCount = String(
      this.entityManager.activeCount
    );
    this.#root.dataset.entityPoolCount = String(
      this.entityManager.pooledCount
    );
    this.#root.dataset.entityRecycledCount = String(
      this.entityManager.recycledCount
    );
    this.#root.dataset.entityPendingCount = String(
      this.entityManager.pendingScheduleCount
    );
    this.#root.dataset.entitySpawnCount = String(
      this.entityManager.spawnCount
    );
    this.#root.dataset.nearestEntityType = nearestEntity?.typeId ?? "";
    this.#root.dataset.nearestEntityDistance = nearestEntity
      ? nearestEntity.distanceAlongTrack.toFixed(
          GAME_CONFIG.hud.distancePrecision
        )
      : "";
    this.#root.dataset.collisionCount = String(this.#collisionCount);
    this.#root.dataset.lastCollisionType = this.#lastCollisionTypeId;
    this.#root.dataset.fatalType = this.#fatalTypeId;
    this.#root.dataset.playerDepleted = String(this.#playerDepleted);
    this.#root.dataset.malariaHoodActive = String(
      this.player.hoodController.isBasicObstructionActive
    );
    this.#root.dataset.malariaHoodExpiresAt =
      this.player.hoodController.obstructionExpiresAtMs === null
        ? ""
        : String(this.player.hoodController.obstructionExpiresAtMs);
    this.#root.dataset.qteHoodMode = String(
      this.player.hoodController.qteModeActive
    );
    const hoodDiagnostics =
      this.player.hoodController.animationDiagnostics;
    this.#root.dataset.malariaHoodRestoring = String(
      hoodDiagnostics.restoring
    );
    this.#root.dataset.malariaVisualActive = String(
      hoodDiagnostics.active || hoodDiagnostics.restoring
    );
    this.#root.dataset.malariaHoodRestoreExpiresAt =
      hoodDiagnostics.restoreExpiresAtMs === null
        ? ""
        : String(hoodDiagnostics.restoreExpiresAtMs);
    this.#root.dataset.malariaHoodRotationX =
      hoodDiagnostics.rotationX.toFixed(
        GAME_CONFIG.hud.minimapProgressPrecision
      );
    this.#root.dataset.malariaHoodRotationZ =
      hoodDiagnostics.rotationZ.toFixed(
        GAME_CONFIG.hud.minimapProgressPrecision
      );
    this.#root.dataset.malariaCoverageLimit = String(
      hoodDiagnostics.coverageLimit
    );
    const hazardDiagnostics = this.bloodPressureHazards.diagnostics;
    const reflectionDiagnostics = this.player.reflectionDiagnostics;
    this.#root.dataset.bpCheckCount = String(
      hazardDiagnostics.checkCount
    );
    this.#root.dataset.woundChance =
      hazardDiagnostics.lastWoundChance.toFixed(
        GAME_CONFIG.hud.probabilityPrecision
      );
    this.#root.dataset.lowBpChance =
      hazardDiagnostics.lastLowBloodPressureChance.toFixed(
        GAME_CONFIG.hud.probabilityPrecision
      );
    this.#root.dataset.lastBpHazardRoll =
      hazardDiagnostics.lastRoll === null
        ? ""
        : hazardDiagnostics.lastRoll.toFixed(
            GAME_CONFIG.hud.probabilityPrecision
          );
    this.#root.dataset.woundTriggerCount = String(
      hazardDiagnostics.woundTriggerCount
    );
    this.#root.dataset.woundSpawnCount = String(
      this.#woundSpawnCount
    );
    this.#root.dataset.activeWoundCount = String(
      this.entityManager.activeWoundCount
    );
    this.#root.dataset.lowBpTriggerCount = String(
      hazardDiagnostics.lowBloodPressureTriggerCount
    );
    this.#root.dataset.lowBpStasisActive = String(
      this.bloodPressureHazards.isStasisActive(clockNowMs)
    );
    this.#root.dataset.lowBpStasisExpiresAt =
      hazardDiagnostics.stasisExpiresAtMs === null
        ? ""
        : String(hazardDiagnostics.stasisExpiresAtMs);
    this.#root.dataset.lowBpCooldownActive = String(
      this.bloodPressureHazards.isCooldownActive(clockNowMs)
    );
    this.#root.dataset.lowBpCooldownExpiresAt =
      hazardDiagnostics.cooldownExpiresAtMs === null
        ? ""
        : String(hazardDiagnostics.cooldownExpiresAtMs);
    this.#root.dataset.vesselEnvironmentColor =
      reflectionDiagnostics.environmentColor;
    this.#root.dataset.rbcReflectedBodyColor =
      reflectionDiagnostics.bodyColor;
    this.#root.dataset.rbcReflectedCockpitColor =
      reflectionDiagnostics.cockpitColor;
    const instrumentDiagnostics = this.hud.instrumentDiagnostics;

    if (instrumentDiagnostics) {
      const instrumentConfig = GAME_CONFIG.flightInstruments;
      this.#root.dataset.attitudeX = instrumentDiagnostics.attitudeX.toFixed(
        instrumentConfig.coordinatePrecision
      );
      this.#root.dataset.attitudeY = instrumentDiagnostics.attitudeY.toFixed(
        instrumentConfig.coordinatePrecision
      );
      this.#root.dataset.altitude = instrumentDiagnostics.altitude.toFixed(
        instrumentConfig.altitudePrecision
      );
      this.#root.dataset.vesselDiameter =
        instrumentDiagnostics.vesselDiameter.toFixed(
          instrumentConfig.altitudePrecision
        );
      this.#root.dataset.viewHeading =
        instrumentDiagnostics.headingDegrees.toFixed(
          instrumentConfig.anglePrecision
        );
      this.#root.dataset.viewPitch =
        instrumentDiagnostics.pitchDegrees.toFixed(
          instrumentConfig.anglePrecision
        );
    }

    const qteDiagnostics = this.qteSystem.diagnostics;
    this.#root.dataset.qtePhase = qteDiagnostics.phase;
    this.#root.dataset.gasExchangeStatus = qteDiagnostics.status;
    this.#root.dataset.gasExchangeAttempts = String(
      qteDiagnostics.attempts
    );
    this.#root.dataset.qteOxygenCount = String(
      qteDiagnostics.oxygenCount
    );
    this.#root.dataset.qteCarbonDioxideCount = String(
      qteDiagnostics.carbonDioxideCount
    );
    this.#root.dataset.qteTriggerType =
      qteDiagnostics.activeTriggerType ?? "";
    this.#root.dataset.qteExchangeRegion =
      qteDiagnostics.exchangeRegion;
    this.#root.dataset.qteOpportunityCount = String(
      qteDiagnostics.opportunityCount
    );
    this.#root.dataset.qteActiveOpportunity =
      qteDiagnostics.activeOpportunityNumber === null
        ? ""
        : String(qteDiagnostics.activeOpportunityNumber);
    this.#root.dataset.qteNextOpportunity =
      qteDiagnostics.nextOpportunityNumber === null
        ? ""
        : String(qteDiagnostics.nextOpportunityNumber);
    this.#root.dataset.qteNextTriggerType =
      qteDiagnostics.nextTriggerType ?? "";
    this.#root.dataset.qteNextTriggerDistance =
      qteDiagnostics.nextTriggerDistance === null
        ? ""
        : String(qteDiagnostics.nextTriggerDistance);
    this.#root.dataset.qteExpiresAt =
      qteDiagnostics.qteExpiresAtMs === null
        ? ""
        : String(qteDiagnostics.qteExpiresAtMs);
    this.#root.dataset.qteResultExpiresAt =
      qteDiagnostics.resultExpiresAtMs === null
        ? ""
        : String(qteDiagnostics.resultExpiresAtMs);
    this.#root.dataset.qteLastOutcome =
      qteDiagnostics.lastOutcome ?? "";
    this.#root.dataset.qteCanCompleteLevel = String(
      qteDiagnostics.canCompleteLevel
    );
    this.#root.dataset.gasTokenVisible = String(
      this.gasToken.visible
    );
    this.#root.dataset.gasTokenDistance = String(
      this.gasToken.distanceAlongTrack
    );
    this.#root.dataset.rbcColorState = state.rbcColorState;
    this.#root.dataset.rbcBodyColor = reflectionDiagnostics.bodyColor;
    this.#root.dataset.rbcCockpitColor =
      reflectionDiagnostics.cockpitColor;
    const cutsceneDiagnostics = this.#cutsceneManager.diagnostics;
    this.#root.dataset.cutsceneActive = String(
      cutsceneDiagnostics.active
    );
    this.#root.dataset.cutsceneType = cutsceneDiagnostics.type ?? "";
    this.#root.dataset.cutscenePhase = cutsceneDiagnostics.phase ?? "";
    this.#root.dataset.cutsceneProgress =
      cutsceneDiagnostics.progress.toFixed(
        GAME_CONFIG.hud.minimapProgressPrecision
      );
    this.#root.dataset.cutsceneStartedAt =
      cutsceneDiagnostics.startedAtMs === null
        ? ""
        : String(cutsceneDiagnostics.startedAtMs);
    this.#root.dataset.cutsceneExpiresAt =
      cutsceneDiagnostics.expiresAtMs === null
        ? ""
        : String(cutsceneDiagnostics.expiresAtMs);
    this.#root.dataset.cutsceneVisualVisible = String(
      this.hud.cutsceneDiagnostics.visible
    );
    this.#root.dataset.levelTransitionCount = String(
      this.#levelTransitionCount
    );
    this.#root.dataset.cutsceneCompletionCount = String(
      this.#cutsceneCompletionCount
    );
    this.#root.dataset.levelsCompleted = String(
      this.#runTotals.levelsCompleted
    );
    this.#root.dataset.runStartedAt =
      this.#runStartedAtMs === null ? "" : String(this.#runStartedAtMs);
    this.#root.dataset.runCompletedAt =
      this.#runCompletedAtMs === null
        ? ""
        : String(this.#runCompletedAtMs);
  }

  #handleCollisionResult(result) {
    if (result.collisionCount === 0) {
      return false;
    }

    this.#collisionCount += result.collisionCount;
    this.#lastCollisionTypeId = result.events[0].typeId;
    this.#playerDepleted = result.playerDepleted;

    if (result.fatalTypeId) {
      this.#fatalTypeId = result.fatalTypeId;
      const isStroke = this.level.id === 3;

      if (
        this.#enterGameOver(
          isStroke
            ? GAME_STATES.GAME_OVER_STROKE
            : GAME_STATES.GAME_OVER_FALL,
          isStroke ? CUTSCENE_TYPES.STROKE : CUTSCENE_TYPES.FALL
        )
      ) {
        return true;
      }
    }

    if (
      result.playerDepleted &&
      this.#enterGameOver(
        GAME_STATES.GAME_OVER_RECYCLE,
        CUTSCENE_TYPES.RECYCLE
      )
    ) {
      return true;
    }

    let intoxicationStarted = false;
    let bloodRuptureStarted = false;
    let carbonMonoxidePoisoningStarted = false;

    if (result.events.some((event) => event.typeId === "alcohol")) {
      const event = this.statusEffects.tryStart(
        this.player.state.alcoholCount,
        this.#session.nowMs,
        this.input.getPressedDrivingCodes()
      );

      if (event) {
        intoxicationStarted = true;
        this.input.consumeDrivingActions();
        this.player.hoodController.setCombinedEffectMode(true);
      }
    }

    if (result.triggers.includes(ENTITY_TRIGGERS.MALARIA_HOOD)) {
      this.player.hoodController.triggerBasicObstruction(
        this.#session.nowMs
      );
      const ruptureEvent = this.statusEffects.tryStartBloodRupture(
        this.player.state.malariaCount,
        this.#session.nowMs
      );

      if (ruptureEvent) {
        bloodRuptureStarted = true;
        this.player.hoodController.triggerBloodRupture(
          this.#session.nowMs
        );
        this.player.setBloodPressureMaximum(
          GAME_CONFIG.bloodRupture.bloodPressureMaximum
        );
      }
    }

    if (result.events.some((event) => event.typeId === "carbonMonoxide")) {
      const poisoningEvent =
        this.statusEffects.tryStartCarbonMonoxidePoisoning(
          this.player.state.carbonMonoxideCount
        );

      if (poisoningEvent) {
        carbonMonoxidePoisoningStarted = true;
        this.qteSystem.setCarbonMonoxidePoisoned(true);
      }
    }

    const primaryEvent = result.events[0];
    const bloodRuptureDurationSeconds =
      GAME_CONFIG.malaria.obstructionDurationSeconds *
      GAME_CONFIG.bloodRupture.hoodDurationMultiplier;
    const bloodRuptureBpMaximum =
      GAME_CONFIG.bloodRupture.bloodPressureMaximum;
    const poisonedQteThreshold =
      GAME_CONFIG.qte.carbonMonoxidePoisoningThreshold;
    const deltaCopy =
      "Score " +
      this.#formatSigned(result.scoreDelta) +
      " / HP " +
      this.#formatSigned(result.hpDelta);
    this.hud.showMessage({
      kicker:
        bloodRuptureStarted
          ? "重大狀態 / " + bloodRuptureDurationSeconds + " 秒"
          : carbonMonoxidePoisoningStarted
            ? "累積性狀態"
            : intoxicationStarted
              ? "狀態效果 / " +
                GAME_CONFIG.intoxication.durationSeconds +
                " 秒"
              : primaryEvent.category === "BUFF"
                ? "營養物已吸收"
                : primaryEvent.category === "FATAL"
                  ? "致命碰撞"
                  : "碰撞減益物",
      title: bloodRuptureStarted
        ? "血球破裂"
        : carbonMonoxidePoisoningStarted
          ? "CO 中毒"
          : intoxicationStarted
            ? "酒精中毒"
            : primaryEvent.displayName,
      copy:
        bloodRuptureStarted
          ? "引擎蓋與水蒸氣將遮蔽視線，血壓上限暫時降為 " +
            bloodRuptureBpMaximum +
            " mmHg。"
          : carbonMonoxidePoisoningStarted
            ? "本關氣體交換時，O 與 C 必須各連打 " +
              poisonedQteThreshold +
              " 次。"
            : intoxicationStarted
              ? "操作將延遲或失效，血壓每 " +
                GAME_CONFIG.intoxication.bpRandomIntervalMs +
                "ms 波動並產生 S 型偏移。"
              : result.collisionCount > 1
                ? deltaCopy +
                  " / 共碰撞 " +
                  result.collisionCount +
                  " 個物體"
                : deltaCopy,
      tone: primaryEvent.category === "BUFF" ? "INFO" : "CAUTION",
      nowMs: this.#session.nowMs
    });
    return false;
  }

  #enterGameOver(gameOverState, mode) {
    const entered = gameOverState === GAME_STATES.GAME_OVER_TIMEOUT
      ? this.#session.enterTimeoutGameOver()
      : this.#session.enterGameOver(gameOverState);

    if (!entered) {
      return false;
    }

    this.statusEffects.releaseActiveControls();
    this.input.reset();
    this.gasToken.hide();
    this.player.hoodController.setQteMode(false);
    this.hud.hideMessage();
    this.hud.hideQte();
    this.hud.hideOverlay();
    const snapshot = this.#cutsceneManager.start(
      mode,
      this.#session.nowMs,
      {
        levelId: this.level.id,
        checkpointSeed: this.#levelCheckpoint.seed
      }
    );
    this.hud.renderCutscene(snapshot);
    this.#pointerLock.exit();
    return true;
  }

  #checkForTimeout() {
    if (this.#session.state === GAME_STATES.GAME_OVER_TIMEOUT) {
      return true;
    }

    if (
      !this.#session.hasTimedOut ||
      this.levelManager.isAtEnd(this.player.state.distanceAlongTrack)
    ) {
      return false;
    }

    return this.#enterGameOver(
      GAME_STATES.GAME_OVER_TIMEOUT,
      CUTSCENE_TYPES.TIMEOUT
    );
  }

  #getStatuses(nowMs) {
    const statuses = [];

    if (this.statusEffects.isIntoxicated) {
      statuses.push({
        id: "alcohol-intoxication",
        label: "酒精中毒",
        tone: "DANGER",
        expiresAtMs: this.statusEffects.intoxicationExpiresAtMs
      });
    }

    if (this.statusEffects.isBloodRuptureActive) {
      statuses.push({
        id: "blood-rupture",
        label:
          "血球破裂 / BP 上限 " +
          GAME_CONFIG.bloodRupture.bloodPressureMaximum,
        tone: "DANGER",
        expiresAtMs: this.statusEffects.bloodRuptureExpiresAtMs
      });
    }

    if (this.statusEffects.isCarbonMonoxidePoisoned) {
      statuses.push({
        id: "carbon-monoxide-poisoning",
        label:
          "CO 中毒 / O、C 各 " +
          GAME_CONFIG.qte.carbonMonoxidePoisoningThreshold +
          " 次",
        tone: "DANGER",
        expiresAtMs: null
      });
    }

    if (this.bloodPressureHazards.isStasisActive(nowMs)) {
      statuses.push({
        id: "low-bp-stasis",
        label: "低血壓停滯",
        tone: "DANGER",
        expiresAtMs: this.bloodPressureHazards.stasisExpiresAtMs
      });
    } else if (this.bloodPressureHazards.isCooldownActive(nowMs)) {
      statuses.push({
        id: "low-bp-cooldown",
        label: "低血壓冷卻",
        tone: "INFO",
        expiresAtMs: this.bloodPressureHazards.cooldownExpiresAtMs
      });
    }

    if (
      this.player.hoodController.isBasicObstructionActive &&
      !this.statusEffects.isBloodRuptureActive
    ) {
      statuses.push({
        id: "malaria-hood",
        label: "瘧原蟲頭罩遮蔽",
        tone: "CAUTION",
        expiresAtMs:
          this.player.hoodController.obstructionExpiresAtMs
      });
    }

    return statuses;
  }

  #showLowBloodPressureWarning(nowMs) {
    this.hud.showMessage({
      kicker: "低血壓風險",
      title: "低血壓警告",
      copy: "血流速度過慢，請按 Z 提高血壓",
      tone: "DANGER",
      durationSeconds: null,
      nowMs
    });
  }

  #formatSigned(value) {
    return value > 0 ? "+" + value : String(value);
  }

  #recordLevelCompletion() {
    if (this.#completedLevelIds.has(this.level.id)) {
      return false;
    }

    this.#completedLevelIds.add(this.level.id);
    this.#runTotals.levelsCompleted += 1;
    this.#runTotals.gasExchangeSuccessCount += Number(
      this.qteSystem.status === "SUCCESS"
    );
    this.#runTotals.woundDodgedCount +=
      this.player.state.woundDodgedCount;
    return true;
  }

  #createFinalSummary() {
    const elapsedMs =
      this.#runStartedAtMs === null || this.#runCompletedAtMs === null
        ? 0
        : Math.max(0, this.#runCompletedAtMs - this.#runStartedAtMs);

    return Object.freeze({
      score: this.player.state.score,
      hp: this.player.state.hp,
      levelsCompleted: this.#runTotals.levelsCompleted,
      gasExchangeSuccessCount:
        this.#runTotals.gasExchangeSuccessCount,
      woundDodgedCount: this.#runTotals.woundDodgedCount,
      elapsedSeconds:
        elapsedMs / GAME_CONFIG.timing.millisecondsPerSecond
    });
  }

  #resetRunProgress() {
    this.#runStartedAtMs = null;
    this.#runCompletedAtMs = null;
    this.#runTotals = {
      levelsCompleted: 0,
      gasExchangeSuccessCount: 0,
      woundDodgedCount: 0
    };
    this.#completedLevelIds = new Set();
    this.#finalSummary = null;
    this.#levelTransitionCount = 0;
    this.#cutsceneCompletionCount = 0;
  }

  #replaceLevelRuntime({ levelId, playerState, checkpoint = null }) {
    this.statusEffects.reset();
    this.input.reset();
    this.#cutsceneManager.reset();
    this.hud.hideCutscene();
    this.hud.hideMessage();
    this.hud.hideQte();

    this.scene.remove(this.entityManager.group);
    this.scene.remove(this.gasToken.group);
    this.scene.remove(this.track.group);
    this.scene.remove(this.player.worldGroup);
    this.camera.remove(this.player.cockpitGroup);
    this.entityManager.dispose();
    this.track.dispose();
    this.player.dispose();

    this.level = this.levelManager.loadLevel(levelId);
    this.#session = new GameSession({
      durationSeconds: this.level.targetDriveSeconds
    });
    this.track = new VesselTrack({ level: this.level });
    this.player = new PlayerRBC({
      config: GAME_CONFIG,
      stateOverrides: playerState
    });
    this.#levelCheckpoint = checkpoint ?? createLevelCheckpoint(
      this.player.state,
      this.level.seed
    );
    this.qteSystem = new QTESystem({ level: this.level });
    this.assetFactory = new ProceduralAssetFactory({
      documentRef: this.#document
    });
    this.entityManager = new EntityManager({
      track: this.track,
      level: this.level,
      assetFactory: this.assetFactory
    });
    this.gasToken = this.assetFactory.createGasToken(this.track);
    this.bloodPressureHazards = new BloodPressureHazardSystem({
      levelId: this.level.id,
      random: new SeededRandom(
        (this.level.seed ^
          GAME_CONFIG.bloodPressureHazards.randomSeedSalt) >>>
          0
      )
    });
    this.statusEffects = new StatusEffectManager({
      random: new SeededRandom(
        (this.level.seed ^ GAME_CONFIG.intoxication.randomSeedSalt) >>> 0
      )
    });

    this.scene.add(this.track.group);
    this.scene.add(this.entityManager.group);
    this.scene.add(this.gasToken.group);
    this.scene.add(this.player.worldGroup);
    this.camera.add(this.player.cockpitGroup);
    this.cameraController.reset();
    this.#resetAttemptDiagnostics();

    const initialFrame = this.track.getFrameAtDistance(
      this.player.state.distanceAlongTrack
    );
    this.player.syncWorldTransform(initialFrame);
    this.#syncGasToken();
    this.entityManager.update(this.player.state, 0);
    this.cameraController.updateCamera(
      this.camera,
      initialFrame,
      this.player.state.lateralX,
      this.player.state.lateralY
    );
    this.#publishLevelMetadata();
    return this.level;
  }

  #resetAttemptDiagnostics() {
    this.#pointerLockErrorName = "";
    this.#pointerLockErrorMessage = "";
    this.#collisionCount = 0;
    this.#lastCollisionTypeId = "";
    this.#fatalTypeId = "";
    this.#playerDepleted = false;
    this.#woundSpawnCount = 0;
  }

  #publishLevelMetadata() {
    this.#root.dataset.currentLevel = String(this.level.id);
    this.#root.dataset.levelName = this.level.name;
    this.#root.dataset.minimapPathId = this.level.minimapPathId;
    this.#root.dataset.trackStart = String(this.level.start.distance);
    this.#root.dataset.trackEnd = String(this.level.end.distance);
    this.#root.dataset.trackSections = String(this.track.sections.length);
    this.#root.dataset.gasExchangeRegion = this.level.gasExchange.region;
    this.#root.dataset.gasExchangeOpportunityCount = String(
      this.level.gasExchange.opportunityCount
    );
    this.#root.dataset.cachedFrames = String(
      this.track.cachedFrameCount
    );
    this.#root.dataset.checkpointLevel = String(
      this.#levelCheckpoint.levelId
    );
    this.#root.dataset.checkpointHp = String(this.#levelCheckpoint.hp);
    this.#root.dataset.checkpointScore = String(
      this.#levelCheckpoint.score
    );
    this.#root.dataset.checkpointSeed = String(
      this.#levelCheckpoint.seed
    );
    this.#root.dataset.checkpointRbcColorState =
      this.#levelCheckpoint.rbcColorState;
    this.#root.dataset.entityBatchCount = String(
      this.entityManager.batchCount
    );
    this.#root.dataset.entityScheduleCount = String(
      this.entityManager.scheduleCount
    );
    this.#root.dataset.gasTokenPartCount = String(
      this.gasToken.partCount
    );
  }

  #retryCurrentLevel() {
    const playerState = createRetryPlayerState(this.#levelCheckpoint);
    this.#replaceLevelRuntime({
      levelId: this.#levelCheckpoint.levelId,
      playerState,
      checkpoint: this.#levelCheckpoint
    });
    this.#root.dataset.lastRestartMode = "LEVEL_RETRY";
    this.hud.showLevelReady(this.level);
  }

  #restartRun() {
    this.#resetRunProgress();
    const playerState = createLevelStartPlayerState({
      levelId: GAME_CONFIG.game.initialLevelId,
      hp: GAME_CONFIG.hp.initial,
      score: GAME_CONFIG.score.initial
    });
    this.#replaceLevelRuntime({
      levelId: GAME_CONFIG.game.initialLevelId,
      playerState
    });
    this.#root.dataset.lastRestartMode = "RUN_RESTART";
    this.hud.showReady();
  }

  #handlePrimaryAction = () => {
    if (
      this.#session.state === GAME_STATES.GAME_OVER_RECYCLE ||
      this.#session.state === GAME_STATES.GAME_OVER_FALL ||
      this.#session.state === GAME_STATES.GAME_OVER_STROKE ||
      this.#session.state === GAME_STATES.GAME_OVER_TIMEOUT
    ) {
      this.#retryCurrentLevel();
    } else if (this.#session.state === GAME_STATES.VICTORY) {
      this.#restartRun();
    }

    this.#activateControls();
  };

  #handleRestartAction = () => {
    this.#restartRun();
    this.#activateControls();
  };

  #handleMenuAction = () => {
    if (this.#isMobile) {
      this.#mobileControls.reset();
    } else {
      this.#pointerLock.exit();
    }
    this.#restartRun();
    this.#root.dataset.lastRestartMode = "MAIN_MENU";
  };

  #activateControls() {
    if (this.#isMobile) {
      return this.#activateMobileControls();
    }

    this.#requestPointerLock();
    return true;
  }

  #activateMobileControls() {
    if (!this.#mobileControls.isLandscape) {
      return false;
    }

    if (this.#runStartedAtMs === null) {
      this.#runStartedAtMs = this.#session.nowMs;
    }

    void this.#mobileControls.requestLandscapeLock();
    this.#session.acquirePointerLock();
    this.#pointerLockErrorName = "";
    this.#pointerLockErrorMessage = "";
    this.hud.hideOverlay();

    if (this.#session.state === GAME_STATES.LOW_BP_STASIS) {
      this.#showLowBloodPressureWarning(this.#session.nowMs);
    } else if (this.#session.state === GAME_STATES.PLAYING) {
      this.hud.showMessage({
        kicker: "觸控駕駛已啟用",
        title: "循環圖已同步",
        copy: "拖按方向鍵移動機身；氣體交換時連點 O 與 C。",
        tone: "INFO",
        nowMs: this.#session.nowMs
      });
    }

    return true;
  }

  #requestPointerLock() {
    if (this.#runStartedAtMs === null) {
      this.#runStartedAtMs = this.#session.nowMs;
    }

    this.#session.prepareForPointerLock();
    this.hud.showPointerLockPending();
    void this.#pointerLock.request(this.#session.nowMs);
  }

  #handlePointerLockChange = (pointerLocked) => {
    if (pointerLocked) {
      this.#session.acquirePointerLock();
      this.#pointerLockErrorName = "";
      this.#pointerLockErrorMessage = "";
      this.hud.hideOverlay();

      if (this.#session.state === GAME_STATES.LOW_BP_STASIS) {
        this.#showLowBloodPressureWarning(this.#session.nowMs);
      } else if (this.#session.state === GAME_STATES.PLAYING) {
        this.hud.showMessage({
          kicker: "循環導航",
          title: "循環圖已同步",
          copy: "循環圖已與紅血球位置同步。",
          tone: "INFO",
          nowMs: this.#session.nowMs
        });
      }
      return;
    }

    this.#pauseForControlLoss();
  };

  #handlePointerLockError = (error) => {
    this.#session.rejectPointerLock();
    this.#queueIntoxicatedInput(this.#session.nowMs);
    this.statusEffects.releaseActiveControls();
    this.input.reset();

    this.#pointerLockErrorName =
      error?.name || error?.type || "PointerLockError";
    this.#pointerLockErrorMessage =
      error?.message || "瀏覽器未提供進一步的拒絕原因。";

    this.hud.showPointerLockError(
      "滑鼠鎖定被瀏覽器拒絕。遊戲已暫停，但計時器仍會繼續；請先點選遊戲畫面再重試。"
    );
  };

  #handleVisibilityChange = () => {
    if (!this.#document.hidden) {
      return;
    }

    this.#pauseForControlLoss();

    if (!this.#isMobile) {
      this.#pointerLock.exit();
    }
  };

  #handleMobilePause = () => {
    this.#pauseForControlLoss();
  };

  #handleMobileOrientationChange = (isLandscape) => {
    if (!isLandscape) {
      this.#pauseForControlLoss();
    }
  };

  #pauseForControlLoss() {
    if (!this.#session.releasePointerLock()) {
      return false;
    }

    this.#queueIntoxicatedInput(this.#session.nowMs);
    this.statusEffects.releaseActiveControls();
    this.input.reset();
    this.hud.showPaused(this.#session.pausedFromState);
    return true;
  }

  #resize = () => {
    const width = Math.max(1, this.#window.innerWidth);
    const height = Math.max(1, this.#window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(
        this.#window.devicePixelRatio,
        this.#isMobile
          ? GAME_CONFIG.renderer.mobileMaximumPixelRatio
          : GAME_CONFIG.renderer.maximumPixelRatio
      ) * (
        this.#isMobile
          ? GAME_CONFIG.renderer.mobileRenderResolutionScale
          : GAME_CONFIG.renderer.renderResolutionScale
      )
    );
    this.renderer.setSize(width, height, false);
  };
}
