import { GAME_CONFIG } from "../js/config.js?v=stable-v1.1-20260715-r2";
import {
  CUTSCENE_TYPES,
  CutsceneManager
} from "../js/cutscenes/CutsceneManager.js?v=stable-v1.1-20260715-r2";
import { CutsceneRenderer } from "../js/cutscenes/CutsceneRenderer.js?v=stable-v1.1-20260715-r2";

const parameters = new URLSearchParams(window.location.search);
const requestedType = (parameters.get("type") ?? "TRANSFER").toUpperCase();
const type = Object.values(CUTSCENE_TYPES).includes(requestedType)
  ? requestedType
  : CUTSCENE_TYPES.TRANSFER;
const requestedProgress = Number(parameters.get("progress") ?? 0.58);
const progress = Number.isFinite(requestedProgress)
  ? Math.min(1, Math.max(0, requestedProgress))
  : 0.58;
const manager = new CutsceneManager();
const renderer = new CutsceneRenderer(document);
const durationSeconds = GAME_CONFIG.cutscenes.durationsSeconds[type];
const context = {
  levelId: type === CUTSCENE_TYPES.STROKE ? 3 : 1,
  fromChamber: "右心房",
  toChamber: "右心室"
};

manager.start(type, 0, context);
const snapshot = manager.update(
  durationSeconds *
    GAME_CONFIG.timing.millisecondsPerSecond *
    progress
);
renderer.render(snapshot);

const layer = document.querySelector("#cutscene-layer");
layer.dataset.preview = "true";
layer.style.setProperty(
  "--cutscene-preview-delay",
  -durationSeconds * progress + "s"
);
document.documentElement.dataset.previewStatus = "READY";
document.documentElement.dataset.previewType = type;
document.documentElement.dataset.previewPhase = snapshot.phase;
document.documentElement.dataset.previewProgress = progress.toFixed(2);
