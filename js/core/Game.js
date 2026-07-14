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
import { GAME_CONFIG } from "../config.js?v=phase06-qte";
import { ENTITY_TRIGGERS } from "../data/entityTypes.js?v=phase06-qte";
import {
  createLevelCheckpoint
} from "../data/schemas.js?v=phase06-qte";
import { CameraController } from "../input/CameraController.js?v=phase06-qte";
import { InputController } from "../input/InputController.js?v=phase06-qte";
import { PointerLockController } from "../input/PointerLockController.js";
import { PlayerRBC } from "../player/PlayerRBC.js?v=phase06-qte";
import { BloodPressureHazardSystem } from "../systems/BloodPressureSystem.js?v=phase06-qte";
import { CollisionSystem } from "../systems/CollisionSystem.js?v=phase06-qte";
import { EntityManager } from "../systems/EntityManager.js?v=phase06-qte";
import {
  canCompleteLevel,
  QTE_EVENTS,
  QTE_OUTCOMES,
  QTE_PHASES,
  QTESystem
} from "../systems/QTESystem.js?v=phase06-qte";
import { HUDManager } from "../ui/HUDManager.js?v=phase06-qte";
import { SeededRandom } from "../utils/SeededRandom.js";
import { ProceduralAssetFactory } from "../world/ProceduralAssetFactory.js?v=phase06-qte";
import { VesselTrack } from "../world/VesselTrack.js?v=phase06-qte";
import { GameLoop } from "./GameLoop.js";
import { GameSession } from "./GameSession.js?v=phase06-qte";
import { GAME_STATES } from "./GameStateMachine.js?v=phase06-qte";
import { LevelManager } from "./LevelManager.js?v=phase06-qte";

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
  #transferExpiresAtMs = null;
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
    windowRef = globalThis.window
  } = {}) {
    if (!documentRef || !windowRef) {
      throw new Error("Game requires a browser document and window.");
    }

    this.#document = documentRef;
    this.#window = windowRef;
    this.#root = requireElement(documentRef, "#game-root");
    this.#canvas = requireElement(documentRef, "#game-canvas");
    this.levelManager = new LevelManager();
    this.level = this.levelManager.currentLevel;
    this.#session = new GameSession({
      durationSeconds: this.level.targetDriveSeconds
    });
    this.hud = new HUDManager(documentRef);

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
      powerPreference: "high-performance"
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
    this.collisionSystem = new CollisionSystem();
    this.input = new InputController({ target: windowRef });
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
    this.#root.dataset.phase = "06";
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
    this.cameraController.attach();
    this.#pointerLock.attach();
    this.hud.actionElement.addEventListener(
      "click",
      this.#requestPointerLock
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
    this.cameraController.detach();
    this.#pointerLock.detach();
    this.hud.actionElement.removeEventListener(
      "click",
      this.#requestPointerLock
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
    this.player.update(deltaSeconds, this.input, this.track);
    this.entityManager.update(this.player.state, deltaSeconds);
    const collisionResult = this.collisionSystem.resolve(
      this.player.state,
      this.entityManager.activeEntities
    );
    const enteredGameOver = this.#handleCollisionResult(collisionResult);
    this.entityManager.recycleConsumed();
    this.gasToken.update(deltaSeconds);
    this.track.update(deltaSeconds);
    this.#simulationUpdateCount += 1;

    if (enteredGameOver) {
      return;
    }

    const qteStart = this.qteSystem.tryStart(
      this.player.state.previousDistanceAlongTrack,
      this.player.state.distanceAlongTrack,
      this.#session.nowMs,
      {
        atLevelEnd: this.levelManager.isAtEnd(
          this.player.state.distanceAlongTrack
        )
      }
    );

    if (qteStart && this.#session.enterQte()) {
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
    this.#updateQte(clockNowMs);
    this.#updateTransfer(clockNowMs);
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
    this.player.hoodController.update(clockNowMs);

    this.hud.update({
      hp: this.player.state.hp,
      maxHp: this.player.state.maxHp,
      bp: this.player.state.bp,
      score: this.player.state.score,
      level: this.level.id,
      levelCount: GAME_CONFIG.game.totalLevelCount,
      location: this.levelManager.getLocationAtDistance(
        distanceAlongTrack
      ),
      speed: this.player.speed,
      distance: this.player.state.distanceAlongTrack,
      trackLength: this.track.trackLength,
      realClockElapsedSeconds,
      state: this.#session.state,
      fps: this.#fps,
      pointerLocked,
      minimapPathId: this.level.minimapPathId,
      minimapProgress,
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

    this.#transferExpiresAtMs =
      this.#session.nowMs +
      GAME_CONFIG.cutscenes.transferDurationMinSeconds *
        GAME_CONFIG.timing.millisecondsPerSecond;
    this.input.reset();
    this.gasToken.hide();
    this.player.hoodController.setQteMode(false);
    this.hud.hideMessage();
    this.hud.hideQte();
    this.hud.showTransfer(this.qteSystem.status);
    return true;
  }

  #updateTransfer(nowMs) {
    const isTransferState =
      this.#session.state === GAME_STATES.TRANSFER_CUTSCENE;
    const isPausedTransfer =
      this.#session.state === GAME_STATES.PAUSED &&
      this.#session.pausedFromState === GAME_STATES.TRANSFER_CUTSCENE;

    if (
      (!isTransferState && !isPausedTransfer) ||
      this.#transferExpiresAtMs === null ||
      nowMs < this.#transferExpiresAtMs
    ) {
      return;
    }

    if (this.#session.completeTransferCutscene()) {
      this.#transferExpiresAtMs = null;
      this.input.reset();
      this.hud.showLevelComplete({
        gasExchangeStatus: this.qteSystem.status,
        score: this.player.state.score
      });
      this.#pointerLock.exit();
    }
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
      this.#showLowBloodPressureWarning(nowMs);
    }

    if (result.woundTriggered) {
      const wound = this.entityManager.spawnWoundAhead(
        this.player.state
      );

      if (wound) {
        this.#woundSpawnCount += 1;
        this.hud.showMessage({
          kicker: "High blood pressure",
          title: "高血壓警告",
          copy: "前方形成血管破口，請立即閃避。",
          tone: "CAUTION",
          nowMs
        });
      }
    }

    if (this.#session.state === GAME_STATES.LOW_BP_STASIS) {
      this.player.adjustBloodPressure(
        this.input.getBloodPressureRaiseAxis(),
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
    this.#root.dataset.transferExpiresAt =
      this.#transferExpiresAtMs === null
        ? ""
        : String(this.#transferExpiresAtMs);
    this.#root.dataset.transferRemaining =
      this.#transferExpiresAtMs === null
        ? ""
        : Math.max(
            0,
            (this.#transferExpiresAtMs - clockNowMs) /
              GAME_CONFIG.timing.millisecondsPerSecond
          ).toFixed(GAME_CONFIG.hud.timerPrecision);
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

      if (
        this.#enterGameOver(
          GAME_STATES.GAME_OVER_FALL,
          "FALL"
        )
      ) {
        return true;
      }
    }

    if (
      result.playerDepleted &&
      this.#enterGameOver(
        GAME_STATES.GAME_OVER_RECYCLE,
        "RECYCLE"
      )
    ) {
      return true;
    }

    if (result.triggers.includes(ENTITY_TRIGGERS.MALARIA_HOOD)) {
      this.player.hoodController.triggerBasicObstruction(
        this.#session.nowMs
      );
    }

    const primaryEvent = result.events[0];
    const deltaCopy =
      "Score " +
      this.#formatSigned(result.scoreDelta) +
      " / HP " +
      this.#formatSigned(result.hpDelta);
    this.hud.showMessage({
      kicker:
        primaryEvent.category === "BUFF"
          ? "Nutrient acquired"
          : primaryEvent.category === "FATAL"
            ? "Fatal collision"
            : "Hazard contact",
      title: primaryEvent.displayName,
      copy:
        result.collisionCount > 1
          ? deltaCopy + " / " + result.collisionCount + " contacts"
          : deltaCopy,
      tone: primaryEvent.category === "BUFF" ? "INFO" : "CAUTION",
      nowMs: this.#session.nowMs
    });
    return false;
  }

  #enterGameOver(gameOverState, mode) {
    if (!this.#session.enterGameOver(gameOverState)) {
      return false;
    }

    this.input.reset();
    this.gasToken.hide();
    this.player.hoodController.setQteMode(false);
    this.hud.hideMessage();
    this.hud.hideQte();
    this.hud.showGameOver(mode);
    this.#pointerLock.exit();
    return true;
  }

  #getStatuses(nowMs) {
    const statuses = [];

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

    if (this.player.hoodController.isBasicObstructionActive) {
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
      kicker: "Low blood pressure",
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

  #resetLevel() {
    this.scene.remove(this.entityManager.group);
    this.scene.remove(this.gasToken.group);
    this.entityManager.dispose();

    this.qteSystem.reset();
    this.track.resetForRetry();
    this.player.resetForCheckpoint(this.#levelCheckpoint);
    this.cameraController.reset();
    this.input.reset();
    this.#session = new GameSession({
      durationSeconds: this.level.targetDriveSeconds
    });
    this.#transferExpiresAtMs = null;
    this.#pointerLockErrorName = "";
    this.#pointerLockErrorMessage = "";
    this.#collisionCount = 0;
    this.#lastCollisionTypeId = "";
    this.#fatalTypeId = "";
    this.#playerDepleted = false;
    this.#woundSpawnCount = 0;

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
    this.scene.add(this.entityManager.group);
    this.scene.add(this.gasToken.group);

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
    this.hud.hideMessage();
    this.hud.hideQte();
    this.hud.showReady();
    this.#root.dataset.entityBatchCount = String(
      this.entityManager.batchCount
    );
    this.#root.dataset.entityScheduleCount = String(
      this.entityManager.scheduleCount
    );
    this.#root.dataset.gasTokenPartCount = String(
      this.gasToken.partCount
    );
    return true;
  }

  #requestPointerLock = () => {
    if (
      this.#session.state === GAME_STATES.LEVEL_COMPLETE ||
      this.#session.state === GAME_STATES.GAME_OVER_RECYCLE ||
      this.#session.state === GAME_STATES.GAME_OVER_FALL
    ) {
      this.#resetLevel();
    }

    this.#session.prepareForPointerLock();
    void this.#pointerLock.request();
  };

  #handlePointerLockChange = (pointerLocked) => {
    if (pointerLocked) {
      this.#session.acquirePointerLock();
      this.#pointerLockErrorName = "";
      this.#pointerLockErrorMessage = "";
      if (this.#session.state === GAME_STATES.TRANSFER_CUTSCENE) {
        this.hud.showTransfer(this.qteSystem.status);
      } else {
        this.hud.hideOverlay();
      }

      if (this.#session.state === GAME_STATES.LOW_BP_STASIS) {
        this.#showLowBloodPressureWarning(this.#session.nowMs);
      } else if (this.#session.state === GAME_STATES.PLAYING) {
        this.hud.showMessage({
          kicker: "Navigation",
          title: "ROUTE SYNCHRONIZED",
          copy: "循環圖已與紅血球位置同步。",
          tone: "INFO",
          nowMs: this.#session.nowMs
        });
      }
      return;
    }

    if (this.#session.releasePointerLock()) {
      this.input.reset();
      this.hud.showPaused(this.#session.pausedFromState);
    }
  };

  #handlePointerLockError = (error) => {
    this.#session.rejectPointerLock();
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

    if (this.#session.releasePointerLock()) {
      this.input.reset();
      this.hud.showPaused(this.#session.pausedFromState);
    }

    this.#pointerLock.exit();
  };

  #resize = () => {
    const width = Math.max(1, this.#window.innerWidth);
    const height = Math.max(1, this.#window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(
        this.#window.devicePixelRatio,
        GAME_CONFIG.renderer.maximumPixelRatio
      ) * GAME_CONFIG.renderer.renderResolutionScale
    );
    this.renderer.setSize(width, height, false);
  };
}
