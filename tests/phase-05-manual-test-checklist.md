# Phase 05 Manual Test Checklist

## Scope Gate

- [x] Phase 04 and its RBC/mobile correction were PASS before Phase 05 began.
- [x] Only Level 1 remains registered and playable.
- [x] Gas QTE, failed-pass handling, level completion, playable Levels 2-4,
  intoxication steering, full malaria flutter, game-over, endings, and victory
  flows were not added.
- [x] Level 4 BP math is implemented only as the required data-driven contract.

## High-BP Wound

- [x] Levels 1-3 return zero Wound chance at BP 130 or below.
- [x] Levels 1-3 use `0.005 * exp((BP - 130) / 15)` above BP 130.
- [x] Level 4 uses the base formula from BP 80 through 130, including exactly
  0.5% per second at BP 130.
- [x] Level 4 applies x3 above BP 130 and every level respects the 45% cap.
- [x] Level 4 returns zero Wound chance below BP 80 so low-BP handling is
  mutually exclusive.
- [x] Checks occur once per real-clock second only while PLAYING, never once per
  frame and never as catch-up rolls after a pause.
- [x] A successful roll requests one Wound 35-70 units ahead.
- [x] Wounds respect the two-active cap, 45-unit Wound gap, gas trigger/end
  reserves, scheduled/active entities, vessel radius, and 16 placement attempts.
- [x] Existing Wound dodge, Score -200, collision priority, and fatal semantics
  remain covered by regression tests.

## Low-BP Stasis

- [x] BP 80 has 0%; BP 79 has 2.5%; BP 75 has 12.5%; BP 70 has 25%; BP 66
  and lower cap at 35% per second.
- [x] A successful low-BP roll enters `LOW_BP_STASIS` for five absolute seconds.
- [x] Distance, lateral movement, track flow, arrows, entities, animation, and
  collision receive no world-simulation updates during stasis.
- [x] Rendering, HUD diagnostics, status countdowns, and the real clock continue.
- [x] Z continues raising BP; X alone does nothing; holding Z and X together
  still raises BP because X is independently ignored.
- [x] Stasis expiry returns directly to PLAYING, or changes a PAUSED resume target
  from `LOW_BP_STASIS` to PLAYING.
- [x] The ten-second cooldown starts after the five-second stasis and uses an
  absolute deadline that continues while paused.
- [x] Low-BP trigger rolls remain disabled during stasis/cooldown and resume only
  after cooldown expiry while PLAYING.

## Vessel Reflection

- [x] `TrackSection` samples its configured start/end color gradient at the
  player's canonical distance.
- [x] `PlayerRBC` blends the body and cockpit toward that local vessel color
  using only values centralized in `js/config.js`.
- [x] Color and subtle emissive changes differ between arterial and venous
  samples without external images, textures, models, fonts, or environment maps.
- [x] Exponential response smoothing changes color only when positive render
  time elapses and avoids abrupt section-boundary flashes.
- [x] Runtime diagnostics expose environment, reflected body, and reflected
  cockpit colors. At the Level 1 start they report `#ff3347`, `#d4222f`, and
  `#d62230` respectively.

## Browser, Layout, And Deployment

- [x] Node shared suite: 125 passed, 0 failed.
- [x] Local Chromium shared suite: 125 passed, 0 failed, including the corrected
  Z-plus-X raise-only case.
- [x] All 62 JS/MJS files pass `node --check`; `git diff --check` passes.
- [x] Local 1280 x 720 render initializes P05 with Three.js r184, 60 FPS,
  16 draw calls, 14,462 triangles, reflection enabled, and no warning/error logs.
- [x] Local 1920 x 1080 render has no document overflow.
- [x] Local 390 x 844 narrow-desktop render has no horizontal overflow and keeps
  the circulation map, BP meter, HUD, canvas, and overlay inside the layout.
- [x] Pointer Lock rejection pauses world distance while the real clock continues
  from 0.8 to 2.1 seconds.
- [x] GitHub Actions run 29349318087 passed build/test and Pages deployment for
  implementation commit `2835cafc37028f97cb51c69df762da389f29dd58`.
- [x] GitHub Pages serves P05 and the live shared suite reports 125/125 with no
  application console warning or error.

The PASS conclusion, defects, corrections, and evidence are recorded in
`reports/phase-05-report.md`.
