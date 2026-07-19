import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

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

export function isMobilePreviewRequested(
  locationRef = globalThis.location,
  config = GAME_CONFIG.deviceSupport
) {
  if (
    !locationRef ||
    !config.previewHostnames.includes(locationRef.hostname)
  ) {
    return false;
  }

  const parameters = new URLSearchParams(locationRef.search ?? "");
  return parameters.get(config.previewQueryParameter) ===
    config.previewQueryValue;
}

export function getDeviceSupport(
  navigatorRef = globalThis.navigator,
  config = GAME_CONFIG.deviceSupport,
  { forceMobile = false } = {}
) {
  const isMobile = forceMobile || isMobileDevice(navigatorRef, config);
  const userAgent =
    typeof navigatorRef?.userAgent === "string"
      ? navigatorRef.userAgent
      : "";
  const platform = /iPhone|iPad|iPod/i.test(userAgent) ||
      (
        navigatorRef?.platform === config.touchTabletPlatform &&
        Number.isFinite(navigatorRef?.maxTouchPoints) &&
        navigatorRef.maxTouchPoints >= config.touchTabletMinimumPoints
      )
    ? config.iosPlatform
    : /Android/i.test(userAgent)
      ? config.androidPlatform
      : config.otherPlatform;

  return Object.freeze({
    supported: true,
    isMobile,
    inputMode: isMobile
      ? config.mobileInputMode
      : config.desktopInputMode,
    platform,
    reason: null
  });
}
