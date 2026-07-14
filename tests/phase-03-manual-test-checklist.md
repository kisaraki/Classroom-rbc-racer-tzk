# Phase 03 Manual Test Checklist

## Scope Gate

- [x] `reports/phase-02-report.md` was PASS before Phase 03 work began.
- [x] Only the first level remains registered and playable.
- [x] No entity, collision, QTE, status-effect, cutscene, completion, or ending
  runtime was added.

## Circulation Map

- [x] The minimap is created dynamically with SVG DOM APIs and no image asset.
- [x] Left ventricle, left atrium, right ventricle, right atrium, lungs, brain,
  and tissues are all present and labelled.
- [x] Eight configured cubic vessel curves connect the seven nodes.
- [x] The first-level path combines three contiguous vessel curves from the
  left ventricle through tissues and the right atrium to the right ventricle.
- [x] The player marker glows, pulses, and uses SVG path length sampling rather
  than node-to-node jumps.
- [x] Foreground Chrome driving advanced map progress from 0.1280 to 0.1366 and
  changed the marker transform continuously.

## HUD And Timing

- [x] HP, BP, Score, Location, and Level 1 / 4 are visible.
- [x] The special-status region displays an explicit empty state when no later
  phase has supplied an active status.
- [x] Status countdown formatting is derived from `expiresAtMs - nowMs`.
- [x] The central message appears after Pointer Lock and expires from an
  absolute deadline.
- [x] During a Pointer Lock rejection, the world stayed paused while the real
  clock continued from 24.7 to 42.2 seconds.

## Browser And Performance

- [x] Node shared suite: 76 passed, 0 failed.
- [x] Browser shared suite: 76 passed, 0 failed.
- [x] 1280 x 720 has no horizontal or vertical overflow and no HUD panel
  overlap after the responsive-spacing fix.
- [x] 1920 x 1080 has no horizontal or vertical overflow and no HUD panel
  overlap after the responsive-spacing fix.
- [x] The in-app browser rendered two consecutive 1920 x 1080 samples at 60
  FPS after removing expensive SVG/background filters.
- [x] Desktop Chrome obtained a real Pointer Lock foreground run and visibly
  advanced the 3D route and SVG marker; later automation retries were rejected
  by Chrome and correctly entered PAUSED.
- [x] Local game and browser-test pages produced no application console errors
  or warnings.
- [x] GitHub Pages workflow passes and the live subpath serves Phase 03 assets.

The PASS conclusion and all evidence are recorded in
`reports/phase-03-report.md`.
