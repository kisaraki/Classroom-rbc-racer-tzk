import { REVISION } from "../../vendor/three.module.js";
import { assertEqual } from "./TestHarness.js";

export function registerVendorTests(harness) {
  harness.test("vendored Three.js revision is pinned to r184", () => {
    assertEqual(REVISION, "184");
  });
}
