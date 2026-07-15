# Phase 09 Manual Test Checklist

## Gate

- [x] `reports/phase-08-report.md` was PASS before Phase 09 began.
- [x] Phase 08 baseline was `169 passed, 0 failed`.
- [x] No Phase 10 long-duration or cross-browser acceptance was claimed.

## Cutscenes

- [x] Level 1 maps right atrium to right ventricle.
- [x] Level 2 maps left atrium to left ventricle.
- [x] Level 3 maps right atrium to right ventricle.
- [x] Level 4 maps left atrium to left ventricle.
- [x] Transfer lasts 4 seconds and remains inside the required 3 to 5 seconds.
- [x] Recycle shows Spleen, Liver, conveyor, RBC, and 12 fragments.
- [x] Fall shows vessel exit, dark tumbling RBC, abyss, and Vessel Rupture.
- [x] Stroke shows impact/blackout/diagnosis phases and bilingual red text.
- [x] Victory shows a bright arterial vessel, O2 flag, six RBCs, and 36 confetti strips.
- [x] All models, labels, and animation elements are generated without external media.

## Progression

- [x] `LevelManager` advances 1 to 2 to 3 to 4 and does not wrap.
- [x] Levels 1 through 3 automatically load the next dataset after transfer.
- [x] Level 4 transfer enters Victory instead of loading another level.
- [x] HP and Score carry into the next level.
- [x] A new checkpoint stores next level id, HP, Score, and fixed level seed.
- [x] Releasing Pointer Lock during transfer does not stop its absolute deadline.
- [x] When Pointer Lock is released, the next level loads and waits for a user click before recapture.

## Endings And Actions

- [x] HP depletion routes to recycle.
- [x] Wound on Levels 1, 2, and 4 routes to fall.
- [x] Wound on Level 3 routes to Stroke.
- [x] Failure exposes retry current level, restart from Level 1, and main menu.
- [x] Victory exposes restart from Level 1 and main menu.
- [x] Return to main menu rebuilds the canonical Level 1 READY state.

## Retry State

- [x] Retry preserves checkpoint seed and Score.
- [x] Retry HP is `Math.max(checkpoint.hp, retryMinimumHp)` and clamps to max HP.
- [x] BP resets to 100.
- [x] Distance, previous distance, lateral X, and lateral Y reset to zero.
- [x] Gas status resets to PENDING and attempts reset to zero.
- [x] Alcohol, delayed input, malaria hood, low-BP state, entities, QTE, and pending cutscene state are rebuilt or cleared.

## Timing

- [x] Cutscenes use absolute `startedAtMs` and `expiresAtMs` values.
- [x] No `setTimeout` or `setInterval` exists in runtime JavaScript.
- [x] Pointer Lock rejection entered PAUSED while REAL CLOCK advanced from T+0.8 to T+1.9 seconds.
- [x] The render loop remains active while world movement is frozen.

## Automated Verification

- [x] Final Node suite: `181 passed, 0 failed`.
- [x] Final local Chromium suite: `181 passed, 0 failed`.
- [x] Final GitHub Pages suite: `181 passed, 0 failed`.
- [x] 71 JavaScript files passed `node --check`.
- [x] `git diff --check` passed.
- [x] GitHub Actions run `29381070025` passed test, artifact, and deploy jobs.

## Visual Verification

- [x] Local and live entry show P09 and initialize Three.js without console errors.
- [x] The 1280 x 720 viewport has no page overflow.
- [x] All five preview modes have a visible stage and correct phase label.
- [x] Corrected Victory layout has two RBC rows and 12 confetti columns.
- [x] Live Victory preview creates six RBCs and 36 confetti strips.

## Known Phase 10 Follow-Up

- [x] Automated Chromium cannot grant foreground Pointer Lock; a natural full-run desktop driving pass remains in the Phase 10 matrix.
- [x] Multi-browser, multi-resolution, long-duration memory, and final performance acceptance remain Phase 10 work.
