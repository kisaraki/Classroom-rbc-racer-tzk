import { createStableTestHarness } from "./unit/suites.js?v=stable-v1.1-20260715-r2";

const harness = createStableTestHarness();
const summary = await harness.run();

console.log("Project Aorta：大動脈計畫室 STABLE unit tests");

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
