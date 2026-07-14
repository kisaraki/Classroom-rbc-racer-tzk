import { EventBus } from "../../js/core/EventBus.js";
import { assertEqual } from "./TestHarness.js";

export function registerEventBusTests(harness) {
  harness.test("EventBus subscribes, emits, and unsubscribes", () => {
    const bus = new EventBus();
    let received = 0;
    const unsubscribe = bus.on("sample", (amount) => {
      received += amount;
    });

    assertEqual(bus.emit("sample", 2), 1);
    assertEqual(received, 2);
    unsubscribe();
    assertEqual(bus.emit("sample", 2), 0);
    assertEqual(received, 2);
  });

  harness.test("EventBus once listeners run once", () => {
    const bus = new EventBus();
    let calls = 0;
    bus.once("sample", () => {
      calls += 1;
    });

    bus.emit("sample");
    bus.emit("sample");
    assertEqual(calls, 1);
  });
}
