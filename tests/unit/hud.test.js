import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { getStatusRemainingSeconds } from "../../js/ui/HUDManager.js?v=stable-v1.1-20260715-r2";
import {
  getMessageRemainingSeconds,
  MessageOverlay
} from "../../js/ui/MessageOverlay.js?v=stable-v1.1-20260715-r2";
import {
  assertEqual,
  assertThrows
} from "./TestHarness.js";

function createMessageFixture() {
  const elements = new Map([
    ["#central-message", { hidden: true, dataset: {} }],
    ["#central-message-kicker", { hidden: false, dataset: {}, textContent: "" }],
    ["#central-message-title", { hidden: false, dataset: {}, textContent: "" }],
    ["#central-message-copy", { hidden: false, dataset: {}, textContent: "" }]
  ]);

  return {
    elements,
    root: {
      querySelector: (selector) => elements.get(selector) ?? null
    }
  };
}

export function registerHudTests(harness) {
  harness.test("status countdown derives remaining time from an absolute deadline", () => {
    assertEqual(getStatusRemainingSeconds(8000, 3000), 5);
    assertEqual(getStatusRemainingSeconds(8000, 9000), 0);
    assertThrows(
      () => getStatusRemainingSeconds(Number.NaN, 3000),
      TypeError
    );
  });

  harness.test("message countdown derives remaining time from an absolute deadline", () => {
    assertEqual(getMessageRemainingSeconds(4800, 1800), 3);
    assertEqual(getMessageRemainingSeconds(4800, 5800), 0);
  });

  harness.test("central message stores content, tone, and an absolute expiry", () => {
    const fixture = createMessageFixture();
    const overlay = new MessageOverlay(fixture.root);

    overlay.show({
      kicker: "Navigation",
      title: "ROUTE SYNCHRONIZED",
      copy: "循環圖已同步。",
      tone: "INFO",
      durationSeconds: 2.5,
      nowMs: 1000
    });

    assertEqual(overlay.isVisible, true);
    assertEqual(overlay.expiresAtMs, 3500);
    assertEqual(fixture.elements.get("#central-message").dataset.tone, "INFO");
    assertEqual(
      fixture.elements.get("#central-message-title").textContent,
      "ROUTE SYNCHRONIZED"
    );
  });

  harness.test("central message expires even when world simulation is paused", () => {
    const fixture = createMessageFixture();
    const overlay = new MessageOverlay(fixture.root);

    overlay.show({
      kicker: "System",
      title: "ABSOLUTE TIMER",
      durationSeconds: 2,
      nowMs: 1000
    });
    assertEqual(overlay.update(2000), 1);
    assertEqual(overlay.isVisible, true);
    assertEqual(overlay.update(3000), 0);
    assertEqual(overlay.isVisible, false);
  });

  harness.test("persistent central messages remain until explicitly hidden", () => {
    const fixture = createMessageFixture();
    const overlay = new MessageOverlay(fixture.root);

    overlay.show({
      kicker: "System",
      title: "PERSISTENT",
      durationSeconds: null,
      nowMs: 1000
    });
    assertEqual(overlay.update(100000), null);
    assertEqual(overlay.isVisible, true);
    overlay.hide();
    assertEqual(overlay.isVisible, false);
  });

  harness.test("central message rejects invalid durations", () => {
    const fixture = createMessageFixture();
    const overlay = new MessageOverlay(fixture.root);

    assertThrows(
      () => overlay.show({
        kicker: "System",
        title: "INVALID",
        durationSeconds: -1,
        nowMs: 0
      }),
      RangeError
    );
    assertEqual(
      GAME_CONFIG.hud.messageDefaultDurationSeconds > 0,
      true
    );
  });
}
