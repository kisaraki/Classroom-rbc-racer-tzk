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
import { GAME_CONFIG } from "../config.js?v=phase05-bp-reflection";
import { ENTITY_TRIGGERS } from "../data/entityTypes.js?v=phase05-bp-reflection";
import { CameraController } from "../input/CameraController.js";
import { InputController } from "../input/InputController.js?v=phase05-bp-reflection-r2";
import { PointerLockController } from "../input/PointerLockController.js";
import { PlayerRBC } from "../player/PlayerRBC.js?v=phase05-bp-reflection";
import { BloodPressureHazardSystem } from "../systems/BloodPressureSystem.js?v=phase05-bp-reflection";
import { CollisionSystem } from "../systems/CollisionSystem.js?v=phase05-bp-reflection";
import { EntityManager } from "../systems/EntityManager.js?v=phase05-bp-reflection";
import { HUDManager } from "../ui/HUDManager.js?v=phase05-bp-reflection";
import { SeededRandom } from "../utils/SeededRandom.js";
import { ProceduralAssetFactory } from "../world/ProceduralAssetFactory.js?v=phase05-bp-reflection";
import { VesselTrack } from "../world/VesselTrack.js?v=phase05-bp-reflection";
import { GameLoop } from "./GameLoop.js";
import { GameSession } from "./GameSession.js?v=phase05-bp-reflection";
import { GAME_STATES } from "./GameStateMachine.js?v=phase05-bp-reflection";
import { LevelManager } from "./LevelManager.js?v=phase05-bp-reflection";

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
  #pointerLock;
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
    this.assetFactory = new ProceduralAssetFactory({ documentRef });
    this.entityManager = new EntityManager({
      track: this.track,
      level: this.level,
      assetFactory: this.assetFactory
    });
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
    this.scene.add(this.player.worldGroup);
    this.camera.add(this.player.cockpitGroup);
    this.scene.add(this.camera);
    this.#createLighting();

    const initialFrame = this.track.getFrameAtDistance(
      this.player.state.distanceAlongTrack
    );
    this.player.syncWorldTransform(initialFrame);
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
    this.#root.dataset.phase = "05";
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
    this.#handleCollisionResult(collisionResult);
    this.entityManager.recycleConsumed();
    this.track.update(deltaSeconds);
    this.#simulationUpdateCount += 1;
  }

  #renderFrame(rawDeltaSeconds) {
    const clockNowMs = this.#session.nowMs;
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
  }

  #handleCollisionResult(result) {
    if (result.collisionCount === 0) {
      return;
    }

    this.#collisionCount += result.collisionCount;
    this.#lastCollisionTypeId = result.events[0].typeId;
    this.#playerDepleted = result.playerDepleted;

    if (result.fatalTypeId) {
      this.#fatalTypeId = result.fatalTypeId;
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

  #requestPointerLock = () => {
    this.#session.prepareForPointerLock();
    void this.#pointerLock.request();
  };

  #handlePointerLockChange = (pointerLocked) => {
    if (pointerLocked) {
      this.#session.acquirePointerLock();
      this.#pointerLockErrorName = "";
      this.#pointerLockErrorMessage = "";
      this.hud.hideOverlay();
      if (this.#session.state === GAME_STATES.LOW_BP_STASIS) {
        this.#showLowBloodPressureWarning(this.#session.nowMs);
      } else {
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
      this.hud.showPaused();
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
      this.hud.showPaused();
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
