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
import { GAME_CONFIG } from "../config.js";
import { CameraController } from "../input/CameraController.js";
import { InputController } from "../input/InputController.js";
import { PointerLockController } from "../input/PointerLockController.js";
import { PlayerRBC } from "../player/PlayerRBC.js";
import { HUDManager } from "../ui/HUDManager.js";
import { VesselTrack } from "../world/VesselTrack.js";
import { GameLoop } from "./GameLoop.js";
import { GameSession } from "./GameSession.js";

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
    this.#session = new GameSession({
      durationSeconds: GAME_CONFIG.timing.prototypeDeadlineSeconds
    });
    this.hud = new HUDManager(documentRef);

    this.scene = new Scene();
    this.scene.background = new Color(
      GAME_CONFIG.palette.prototypeBackground
    );
    this.scene.fog = new FogExp2(
      GAME_CONFIG.palette.prototypeFog,
      GAME_CONFIG.prototype.fogDensity
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

    this.track = new VesselTrack();
    this.player = new PlayerRBC();
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
    this.scene.add(this.player.worldGroup);
    this.camera.add(this.player.cockpitGroup);
    this.scene.add(this.camera);
    this.#createLighting();

    const initialFrame = this.track.getFrameAtDistance(
      this.player.state.distanceAlongTrack
    );
    this.player.syncWorldTransform(initialFrame);
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
    this.#root.dataset.trackSections = String(this.track.sections.length);
    this.#root.dataset.cachedFrames = String(
      this.track.cachedFrameCount
    );
    this.#root.dataset.independentHood = String(
      this.player.hoodController.group.parent ===
        this.player.cockpitGroup
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
    this.track.dispose();
    this.player.dispose();
    this.renderer.dispose();
    this.#disposed = true;
  }

  #createLighting() {
    const lighting = GAME_CONFIG.prototype.lighting;
    const hemisphere = new HemisphereLight(
      GAME_CONFIG.palette.hemisphereSky,
      GAME_CONFIG.palette.hemisphereGround,
      lighting.hemisphereIntensity
    );
    hemisphere.name = "prototype-hemisphere-light";
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
    this.track.update(deltaSeconds);
    this.#simulationUpdateCount += 1;
  }

  #renderFrame(rawDeltaSeconds) {
    const frame = this.track.getFrameAtDistance(
      this.player.state.distanceAlongTrack
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
    const pointerLocked = this.#pointerLock.isLocked;

    this.hud.update({
      hp: this.player.state.hp,
      maxHp: this.player.state.maxHp,
      bp: this.player.state.bp,
      score: this.player.state.score,
      location: GAME_CONFIG.prototype.locationLabel,
      speed: this.player.speed,
      distance: this.player.state.distanceAlongTrack,
      trackLength: this.track.trackLength,
      timerRemainingSeconds,
      state: this.#session.state,
      fps: this.#fps,
      pointerLocked
    });
    this.#publishDiagnostics(timerRemainingSeconds, pointerLocked);
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

  #publishDiagnostics(timerRemainingSeconds, pointerLocked) {
    const state = this.player.state;
    this.#root.dataset.gameState = this.#session.state;
    this.#root.dataset.pointerLocked = String(pointerLocked);
    this.#root.dataset.pointerLockErrorName = this.#pointerLockErrorName;
    this.#root.dataset.pointerLockErrorMessage = this.#pointerLockErrorMessage;
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
      )
    );
    this.renderer.setSize(width, height, false);
  };
}
