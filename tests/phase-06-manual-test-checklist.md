# Phase 06 Manual Test Checklist

## Scope Gate

- [x] Phase 05 and its vessel-reflection addition were PASS before Phase 06 began.
- [x] Only Level 1 is registered and playable.
- [x] The slice runs from title/ready through play to Level Complete or Game Over.
- [x] Playable Levels 2-4, complete intoxication steering, full malaria flutter,
  endings, victory, and Phase 10 soak testing were not added early.

## Right Status Toolkit

- [x] The right-side status area permanently shows `KOSMOS TOOLKIT` and
  `探真拓知酷`.
- [x] Prominent instructions cover arrow-key cross-section movement, Z/X BP,
  O/C gas exchange, mouse look, and Esc/pointer-lock pause behavior.
- [x] At 1280 x 720, status bottom is 670.22 px and toolkit bottom is 657.55 px,
  both inside the 720 px viewport; instruction text renders at 11.2 px.
- [x] At 1920 x 1080 and desktop-UA 390 x 844, the document has no horizontal
  overflow and all principal UI regions remain available.

## Gas Token And Triggering

- [x] The Gas Token is built from procedural `InstancedMesh` parts and a
  generated `CanvasTexture` label; no external image, model, video, or font is
  loaded.
- [x] Level 1 places primary, retry, and fallback triggers inside the configured
  tissue-capillary exchange zone.
- [x] Primary and retry triggers use longitudinal crossing and cannot be skipped
  by moving laterally.
- [x] Forward movement beginning exactly at the token coordinate triggers once;
  reverse or stationary samples do not false-trigger.
- [x] The fallback guarantees a QTE before the route can complete while status
  is still `PENDING`.

## QTE Input And Timing

- [x] Entering QTE freezes player distance, entities, animation flow, spawning,
  and collision while renderer, HUD, real clock, and absolute deadlines continue.
- [x] Only O and C are consumed by QTE; repeats are rejected using `event.repeat`.
- [x] O and C each require three presses and do not need to alternate.
- [x] The input deadline is exactly 1500 ms and the result remains for 800 ms.
- [x] Pausing or processing a late frame does not extend either absolute deadline.
- [x] The QTE panel displays attempt, O/C counts, countdown, instruction, and
  success/failure result without being obscured by the malaria hood.

## Success, Failure, And Color

- [x] Success sets gas status to `SUCCESS`, adds 10 score, removes retry, and
  enables the configured post-exchange vessel gradient.
- [x] RBC reflection samples the live vessel color and transitions subtly with
  the surrounding arterial/venous environment.
- [x] First timeout subtracts 3 score, keeps `PENDING`, and schedules one retry.
- [x] Second timeout subtracts 3 score, sets `FAILED`, and still allows the
  player to finish the route.
- [x] Failed exchange preserves the pre-exchange downstream vessel color.
- [x] Retrying the level restores pre-exchange colors, token visibility, flow,
  counters, pending input, and the original deterministic seed.

## Completion And Failure Slice

- [x] The route cannot complete while gas status remains `PENDING`; the fallback
  QTE runs first.
- [x] Both `SUCCESS` and `FAILED` can enter `TRANSFER_CUTSCENE` at the route end.
- [x] Transfer uses a three-second absolute deadline and reaches
  `LEVEL_COMPLETE` even if that deadline expires while paused.
- [x] Level Complete reports score, gas result, and statistics and offers a same-
  level retry instead of prematurely loading Level 2.
- [x] Wound collision enters `GAME_OVER_FALL`; HP reaching zero enters
  `GAME_OVER_RECYCLE`; both stop world simulation.
- [x] Retry restores checkpoint distance, initial BP, camera, input, status,
  entities, and at least 50 HP using the same seed.
- [x] The shared vertical-slice test walks `READY -> PLAYING -> first failure ->
  retry -> second failure -> TRANSFER_CUTSCENE -> LEVEL_COMPLETE`.

## Browser, Regression, And Deployment

- [x] Shared Node suite: 145 passed, 0 failed.
- [x] Local Chromium shared suite: 145 passed, 0 failed.
- [x] All 63 JS/MJS files pass `node --check`; `git diff --check` passes.
- [x] Local scene initializes with Three.js r184, Gas Token visible, 22 draw
  calls, 16,302 triangles, 39 geometries, 4 textures, and no application
  warning/error logs.
- [x] Pointer Lock rejection enters PAUSED while the real clock continues from
  0.5 to 11.8 seconds; Phase 03 retains the foreground-lock driving evidence.
- [x] Mobile Client Hint, iPhone, Android phone/tablet, and desktop-UA iPad cases
  are rejected before game controls are exposed.
- [x] GitHub Actions run 29354558593 shows `Run Phase 06 tests` and passed build,
  test, artifact upload, and Pages deployment for commit
  `c70a13a1bdc0f8753ebe6a3742ba8852a0c34720`.
- [x] GitHub Pages serves Phase 06 and its live shared suite reports 145 passed,
  0 failed after the `phase06-qte-r2` cache refresh.

The PASS conclusion, defects, corrections, and evidence are recorded in
`reports/phase-06-report.md`.
