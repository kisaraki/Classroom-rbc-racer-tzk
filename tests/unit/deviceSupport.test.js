import { GAME_CONFIG } from "../../js/config.js?v=phase08-routes-r1";
import {
  getDeviceSupport,
  isMobileDevice,
  showUnsupportedMobileDevice
} from "../../js/core/DeviceSupport.js?v=phase08-routes-r1";
import {
  assertEqual,
  assertThrows
} from "./TestHarness.js";

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 Chrome/150.0 Safari/537.36";
const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 16; Pixel 10) " +
  "AppleWebKit/537.36 Chrome/150.0 Mobile Safari/537.36";
const ANDROID_TABLET_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 16; Tablet) " +
  "AppleWebKit/537.36 Chrome/150.0 Safari/537.36";

function createElement() {
  return {
    dataset: {},
    hidden: false,
    disabled: false,
    textContent: ""
  };
}

function createUnsupportedFixture() {
  const elements = new Map(
    [
      "#game-root",
      "#game-canvas",
      "#game-hud",
      "#game-overlay",
      ".overlay-index",
      "#overlay-kicker",
      "#overlay-title",
      "#overlay-copy",
      ".overlay-controls",
      "#overlay-action",
      ".overlay-note"
    ].map((selector) => [selector, createElement()])
  );

  return {
    elements,
    root: {
      querySelector: (selector) => elements.get(selector) ?? null
    }
  };
}

export function registerDeviceSupportTests(harness) {
  harness.test("desktop user agents remain supported at any viewport", () => {
    const support = getDeviceSupport({
      userAgent: DESKTOP_USER_AGENT,
      userAgentData: { mobile: false }
    });

    assertEqual(support.supported, true);
    assertEqual(support.isMobile, false);
    assertEqual(support.reason, null);
  });

  harness.test("mobile Client Hint blocks startup before UA fallback", () => {
    const support = getDeviceSupport({
      userAgent: DESKTOP_USER_AGENT,
      userAgentData: { mobile: true }
    });

    assertEqual(support.supported, false);
    assertEqual(support.reason, GAME_CONFIG.deviceSupport.mobileReason);
  });

  harness.test("iPhone and Android phone user agents are rejected", () => {
    assertEqual(
      isMobileDevice({ userAgent: IPHONE_USER_AGENT }),
      true
    );
    assertEqual(
      isMobileDevice({ userAgent: ANDROID_PHONE_USER_AGENT }),
      true
    );
  });

  harness.test("Android tablets and desktop-UA iPads are rejected", () => {
    assertEqual(
      isMobileDevice({ userAgent: ANDROID_TABLET_USER_AGENT }),
      true
    );
    assertEqual(
      isMobileDevice({
        userAgent: DESKTOP_USER_AGENT,
        platform: "MacIntel",
        maxTouchPoints: 5
      }),
      true
    );
  });

  harness.test("mobile refusal screen never exposes game controls", () => {
    const fixture = createUnsupportedFixture();
    const result = showUnsupportedMobileDevice(fixture.root);
    const gameRoot = fixture.elements.get("#game-root");

    assertEqual(result.gameInitialized, false);
    assertEqual(
      gameRoot.dataset.gameState,
      GAME_CONFIG.deviceSupport.blockedState
    );
    assertEqual(
      gameRoot.dataset.deviceSupport,
      GAME_CONFIG.deviceSupport.blockedDatasetValue
    );
    assertEqual(gameRoot.dataset.mobileDevice, "true");
    assertEqual(gameRoot.dataset.gameInitialized, "false");
    assertEqual(fixture.elements.get("#game-canvas").hidden, true);
    assertEqual(fixture.elements.get("#game-hud").hidden, true);
    assertEqual(fixture.elements.get("#game-overlay").hidden, false);
    assertEqual(
      fixture.elements.get("#game-overlay").dataset.mode,
      GAME_CONFIG.deviceSupport.overlayMode
    );
    assertEqual(
      fixture.elements.get("#overlay-title").textContent,
      "不支援手機"
    );
    assertEqual(fixture.elements.get(".overlay-controls").hidden, true);
    assertEqual(fixture.elements.get("#overlay-action").hidden, true);
    assertEqual(fixture.elements.get("#overlay-action").disabled, true);
  });

  harness.test("mobile refusal renderer requires the complete overlay", () => {
    assertThrows(
      () => showUnsupportedMobileDevice({ querySelector: () => null }),
      Error
    );
  });
}
