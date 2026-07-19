import { GAME_CONFIG } from "./config.js?v=stable-v1.1-20260715-r2";
import {
  getDeviceSupport,
  isMobilePreviewRequested
} from "./core/DeviceSupport.js?v=stable-v1.1-20260715-r2";

const gameRoot = document.querySelector("#game-root");
const deviceSupport = getDeviceSupport(
  window.navigator,
  GAME_CONFIG.deviceSupport,
  {
    forceMobile: isMobilePreviewRequested(window.location)
  }
);
const release = GAME_CONFIG.app;

document.title = release.name + " | " + release.subtitle;
document.querySelectorAll("[data-product-name]").forEach((element) => {
  element.textContent = release.name;
});
document.querySelectorAll("[data-product-subtitle]").forEach((element) => {
  element.textContent = release.subtitle;
});
document.querySelectorAll("[data-product-status]").forEach((element) => {
  element.textContent = release.status;
});
document.querySelectorAll("[data-display-version]").forEach((element) => {
  element.textContent = release.displayVersion;
});
gameRoot.dataset.releaseStatus = release.status;
gameRoot.dataset.releaseVersion = release.version;
gameRoot.dataset.releaseDate = release.releaseDate;

gameRoot.dataset.deviceSupport =
  GAME_CONFIG.deviceSupport.supportedDatasetValue;
gameRoot.dataset.mobileDevice = String(deviceSupport.isMobile);
gameRoot.dataset.inputMode = deviceSupport.inputMode;
gameRoot.dataset.mobilePlatform = deviceSupport.platform;
gameRoot.dataset.gameInitialized = "false";

try {
  const { Game } = await import(
    "./core/Game.js?v=stable-v1.1-20260715-r2"
  );
  const game = new Game({ deviceProfile: deviceSupport });
  game.start();
  gameRoot.dataset.gameInitialized = "true";

  window.addEventListener(
    "pagehide",
    () => {
      game.dispose();
    },
    { once: true }
  );
} catch (error) {
  gameRoot.dataset.gameState = "ERROR";
  const overlay = document.querySelector("#game-overlay");
  const title = document.querySelector("#overlay-title");
  const copy = document.querySelector("#overlay-copy");
  const action = document.querySelector("#overlay-action");

  overlay.hidden = false;
  overlay.dataset.mode = "ERROR";
  title.textContent = "WebGL 啟動失敗";
  copy.textContent =
    "Three.js 場景無法建立：" +
    (error.message ?? "未知錯誤");
  action.hidden = true;
  console.error(error);
}
