import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import {
  getDeviceSupport,
  isMobileDevice,
  isMobilePreviewRequested
} from "../../js/core/DeviceSupport.js?v=stable-v1.1-20260715-r2";
import { assertEqual } from "./TestHarness.js";

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

export function registerDeviceSupportTests(harness) {
  harness.test("desktop user agents remain supported at any viewport", () => {
    const support = getDeviceSupport({
      userAgent: DESKTOP_USER_AGENT,
      userAgentData: { mobile: false }
    });

    assertEqual(support.supported, true);
    assertEqual(support.isMobile, false);
    assertEqual(
      support.inputMode,
      GAME_CONFIG.deviceSupport.desktopInputMode
    );
    assertEqual(
      support.platform,
      GAME_CONFIG.deviceSupport.otherPlatform
    );
    assertEqual(support.reason, null);
  });

  harness.test("mobile Client Hint selects supported touch input", () => {
    const support = getDeviceSupport({
      userAgent: DESKTOP_USER_AGENT,
      userAgentData: { mobile: true }
    });

    assertEqual(support.supported, true);
    assertEqual(support.isMobile, true);
    assertEqual(
      support.inputMode,
      GAME_CONFIG.deviceSupport.mobileInputMode
    );
    assertEqual(support.reason, null);
  });

  harness.test("iPhone and Android phone user agents select mobile mode", () => {
    assertEqual(
      isMobileDevice({ userAgent: IPHONE_USER_AGENT }),
      true
    );
    assertEqual(
      isMobileDevice({ userAgent: ANDROID_PHONE_USER_AGENT }),
      true
    );
  });

  harness.test("Android tablets and desktop-UA iPads select mobile mode", () => {
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

  harness.test("mobile profiles distinguish iOS and Android compatibility", () => {
    const ios = getDeviceSupport({
      userAgent: IPHONE_USER_AGENT,
      platform: "iPhone",
      maxTouchPoints: 5
    });
    const ipad = getDeviceSupport({
      userAgent: DESKTOP_USER_AGENT,
      platform: "MacIntel",
      maxTouchPoints: 5
    });
    const android = getDeviceSupport({
      userAgent: ANDROID_PHONE_USER_AGENT
    });

    assertEqual(
      ios.platform,
      GAME_CONFIG.deviceSupport.iosPlatform
    );
    assertEqual(
      ipad.platform,
      GAME_CONFIG.deviceSupport.iosPlatform
    );
    assertEqual(
      android.platform,
      GAME_CONFIG.deviceSupport.androidPlatform
    );
  });

  harness.test("mobile preview override is restricted to local hosts", () => {
    assertEqual(
      isMobilePreviewRequested({
        hostname: "127.0.0.1",
        search: "?input=mobile"
      }),
      true
    );
    assertEqual(
      isMobilePreviewRequested({
        hostname: "localhost",
        search: "?input=mobile"
      }),
      true
    );
    assertEqual(
      isMobilePreviewRequested({
        hostname: "kisaraki.github.io",
        search: "?input=mobile"
      }),
      false
    );
    assertEqual(
      getDeviceSupport(
        {
          userAgent: DESKTOP_USER_AGENT,
          userAgentData: { mobile: false }
        },
        GAME_CONFIG.deviceSupport,
        { forceMobile: true }
      ).inputMode,
      GAME_CONFIG.deviceSupport.mobileInputMode
    );
  });
}
