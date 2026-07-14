import { Game } from "./core/Game.js";

const gameRoot = document.querySelector("#game-root");

try {
  const game = new Game();
  game.start();

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
    "Three.js 場景無法建立：" + (error.message ?? "未知錯誤");
  action.hidden = true;
  console.error(error);
}
