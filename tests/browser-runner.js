import { createPhase06TestHarness } from "./unit/suites.js?v=phase06-qte";

const resultList = document.querySelector("#test-results");
const summaryElement = document.querySelector("#test-summary");
const harness = createPhase06TestHarness();
const summary = await harness.run();

summary.results.forEach((result) => {
  const item = document.createElement("li");
  const label = document.createElement("strong");
  const detail = document.createElement("span");

  item.className = "test-result test-result--" + result.status.toLowerCase();
  label.textContent = result.status + " - " + result.name;
  detail.textContent = result.error
    ? result.error.message
    : result.durationMs.toFixed(2) + " ms";

  item.append(label, detail);
  resultList.append(item);
});

summaryElement.textContent =
  summary.status +
  ": " +
  summary.passed +
  " passed, " +
  summary.failed +
  " failed, " +
  summary.total +
  " total.";
summaryElement.dataset.status = summary.status;
document.documentElement.dataset.testStatus = summary.status;
globalThis.__PHASE_06_TEST_RESULT__ = summary;
