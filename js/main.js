import { GAME_CONFIG } from "./config.js?v=phase08-routes-r1";
import {
  getDeviceSupport,
  showUnsupportedMobileDevice
} from "./core/DeviceSupport.js?v=phase08-routes-r1";

const gameRoot = document.querySelector("#game-root");
const deviceSupport = getDeviceSupport(window.navigator);

if (!deviceSupport.supported) {
  showUnsupportedMobileDevice(document);
} else {
  gameRoot.dataset.deviceSupport =
    GAME_CONFIG.deviceSupport.supportedDatasetValue;
  gameRoot.dataset.mobileDevice = "false";
  gameRoot.dataset.gameInitialized = "false";

  try {
    const { Game } = await import(
      "./core/Game.js?v=phase08-routes-r1"
    );
    const game = new Game();
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
}
