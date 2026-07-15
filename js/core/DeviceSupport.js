import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

function requireElement(root, selector) {
  const element = root?.querySelector?.(selector);

  if (!element) {
    throw new Error("Missing device-support element: " + selector);
  }

  return element;
}

export function isMobileDevice(
  navigatorRef = globalThis.navigator,
  config = GAME_CONFIG.deviceSupport
) {
  const clientHintMobile =
    navigatorRef?.userAgentData?.mobile === true;
  const userAgent =
    typeof navigatorRef?.userAgent === "string"
      ? navigatorRef.userAgent
      : "";
  const userAgentMobile = new RegExp(
    config.mobileUserAgentPattern,
    "i"
  ).test(userAgent);
  const touchTablet =
    navigatorRef?.platform === config.touchTabletPlatform &&
    Number.isFinite(navigatorRef?.maxTouchPoints) &&
    navigatorRef.maxTouchPoints >= config.touchTabletMinimumPoints;

  return clientHintMobile || userAgentMobile || touchTablet;
}

export function getDeviceSupport(
  navigatorRef = globalThis.navigator,
  config = GAME_CONFIG.deviceSupport
) {
  const isMobile = isMobileDevice(navigatorRef, config);

  return Object.freeze({
    supported: !isMobile,
    isMobile,
    reason: isMobile ? config.mobileReason : null
  });
}

export function showUnsupportedMobileDevice(
  root = globalThis.document,
  config = GAME_CONFIG.deviceSupport
) {
  const elements = {
    gameRoot: requireElement(root, "#game-root"),
    canvas: requireElement(root, "#game-canvas"),
    hud: requireElement(root, "#game-hud"),
    overlay: requireElement(root, "#game-overlay"),
    index: requireElement(root, ".overlay-index"),
    kicker: requireElement(root, "#overlay-kicker"),
    title: requireElement(root, "#overlay-title"),
    copy: requireElement(root, "#overlay-copy"),
    controls: requireElement(root, ".overlay-controls"),
    action: requireElement(root, "#overlay-action"),
    note: requireElement(root, ".overlay-note")
  };

  elements.gameRoot.dataset.gameState = config.blockedState;
  elements.gameRoot.dataset.deviceSupport =
    config.blockedDatasetValue;
  elements.gameRoot.dataset.mobileDevice = "true";
  elements.gameRoot.dataset.gameInitialized = "false";
  elements.canvas.hidden = true;
  elements.hud.hidden = true;
  elements.overlay.hidden = false;
  elements.overlay.dataset.mode = config.overlayMode;
  elements.index.textContent = config.overlayIndex;
  elements.kicker.textContent = config.overlayKicker;
  elements.title.textContent = config.overlayTitle;
  elements.copy.textContent = config.overlayCopy;
  elements.controls.hidden = true;
  elements.action.hidden = true;
  elements.action.disabled = true;
  elements.note.textContent = config.overlayNote;

  return Object.freeze({
    gameState: elements.gameRoot.dataset.gameState,
    deviceSupport: elements.gameRoot.dataset.deviceSupport,
    gameInitialized: false
  });
}
