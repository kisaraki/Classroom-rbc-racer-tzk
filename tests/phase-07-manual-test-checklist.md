# Phase 07 Manual Test Checklist

## Scope Gate

- [x] Phase 06 was PASS before Phase 07 began.
- [x] Only Level 1 remains registered and playable.
- [x] Phase 08 Levels 2-4, cross-level loading, victory, and ending work were not added early.
- [x] The implementation remains HTML5, CSS3, Vanilla JavaScript ES Modules, and vendored Three.js only.

## Alcohol Intoxication

- [x] Alcohol retains its normal Score -1 and HP -1 collision effect.
- [x] The fifth alcohol collision starts intoxication immediately; the fourth does not.
- [x] Alcohol hits during intoxication do not extend the original 15-second deadline.
- [x] The S sway uses the configured absolute-time sine formula.
- [x] BP changes once per 400ms update and remains in the 80-130 range.
- [x] Direction, Z, and X transitions use absolute `executeAt` values between 250 and 700ms.
- [x] The 35-percent failed-input path does not enter the delayed queue.
- [x] The runtime creates no per-input `setTimeout` or `setInterval` calls.
- [x] Due controls are dropped when the current main state does not accept them and are not replayed after PLAYING resumes.
- [x] O and C use a separate QTE queue and remain unaffected by intoxication.
- [x] QTE, LOW_BP_STASIS, PAUSED, and TRANSFER_CUTSCENE do not stop the 15-second deadline.
- [x] Natural expiry clears sway, active controls, queued input, and `alcoholCount`, then restores BP to 100 without restoring HP or score.
- [x] The intoxication canvas distortion and ghost overlay do not transform or obscure the HUD.

## Malaria Obstruction

- [x] Malaria retains its Score -3 and HP -3 collision effect.
- [x] One existing procedural hood rises and flaps for an absolute five seconds.
- [x] Primary flap, secondary flap, roll, and offset derive from the original transform instead of accumulating per frame.
- [x] The obstruction restores to its exact closed transform over 0.4 seconds.
- [x] A repeated malaria hit refreshes the same five-second deadline without adding a hood, coverage, or amplitude.
- [x] Direction, BP, speed, world updates, collision, HUD, and minimap behavior remain otherwise unchanged.
- [x] QTE hides the hood while its animation and deadline continue; leaving QTE restores only an effect that is still active.
- [x] LOW_BP_STASIS and PAUSED keep the hood animation and deadline running while the world remains frozen.
- [x] HP depletion, Game Over, retry, and Level Complete restore the hood and clear all obstruction state.

## Status Overlap

- [x] Alcohol and malaria can be active simultaneously with independent deadlines.
- [x] The active overlapping hood is scaled to the configured 55-percent maximum coverage.
- [x] Alcohol alone does not shrink the normally closed hood.
- [x] Malaria alone does not add delayed input, steering failure, or BP randomization.
- [x] A shared case crosses QTE, LOW_BP_STASIS, PAUSED, and TRANSFER_CUTSCENE while both deadlines continue.
- [x] Entering LOW_BP_STASIS releases prior delayed directional state so it cannot resume as a ghost input.
- [x] Retry reconstructs the deterministic status random source from the same level seed.

## HUD And Layout

- [x] The status list displays absolute remaining time for intoxication, malaria, and low-BP states.
- [x] The active-status layout compacts rather than removes KOSMOS TOOLKIT and `探真拓知酷` instructions.
- [x] At 1280 x 720, status bottom is 670.22 px and toolkit bottom is 657.55 px.
- [x] At 1920 x 1080 and desktop-UA 390 x 844, document scroll dimensions match the viewport.
- [x] The Phase 07 title, overlay, README, browser test page, and workflow label all identify the current phase.
- [x] Mobile Client Hint, iPhone, Android phone/tablet, and desktop-UA iPad cases remain rejected before controls are exposed.

## Browser, Regression, And Deployment

- [x] Shared Node suite: 158 passed, 0 failed.
- [x] Local Chromium shared suite: 158 passed, 0 failed.
- [x] All 64 JS/MJS files pass `node --check`; `git diff --check` passes.
- [x] No `setTimeout` or `setInterval` call exists under `js/`.
- [x] Local and Pages scenes initialize with Three.js r184, 22 draw calls, 16,302 triangles, 39 geometries, and 4 textures.
- [x] Local and Pages game/test pages produce no application warning or error logs.
- [x] Pointer Lock rejection enters PAUSED with distance 0 while the real clock advances from 1.1 to 2.8 seconds.
- [x] GitHub Actions run 29375191696 passed `Run Phase 07 tests`, artifact upload, and Pages deployment for commit `0ecdd847ae8430139b1669b9590f70717e78984b`.
- [x] GitHub Pages serves Phase 07 and its live shared suite reports 158 passed, 0 failed.

The automated Chromium environment cannot grant foreground Pointer Lock. A normal desktop-browser driving pass remains recommended for subjective steering and obstruction appearance, while the rejection path, timing, geometry, state transitions, and production ES Modules are covered here.

The PASS conclusion, defects, corrections, evidence, and residual risks are recorded in `reports/phase-07-report.md`.
