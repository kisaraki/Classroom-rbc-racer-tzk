import { createPhase01TestHarness } from "./unit/suites.js";

const harness = createPhase01TestHarness();
const summary = await harness.run();

console.log("RBC Racer Phase 01 unit tests");

summary.results.forEach((result) => {
  const duration = result.durationMs.toFixed(2);
  console.log(result.status + " " + result.name + " (" + duration + " ms)");

  if (result.error) {
    console.error(result.error.stack ?? result.error.message);
  }
});

console.log(
  "Summary: " +
    summary.passed +
    " passed, " +
    summary.failed +
    " failed, " +
    summary.total +
    " total."
);

if (summary.failed > 0) {
  process.exitCode = 1;
}
