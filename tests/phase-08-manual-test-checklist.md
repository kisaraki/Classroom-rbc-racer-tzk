# Phase 08 Manual Test Checklist

## Scope Gate

- [x] Phase 07 was PASS before Phase 08 began.
- [x] Levels 2 through 4 are added only through config values and `levels.js` semantics.
- [x] No Level 2, Level 3, or Level 4 Manager/System/class fork exists.
- [x] Automatic cross-level progression, conveyors, endings, victory, and whole-run restart remain excluded for Phase 09.
- [x] The implementation remains HTML5, CSS3, Vanilla JavaScript ES Modules, and vendored Three.js only.
- [x] No external image, model, video, font, framework, backend, or database was added.

## Level 2 Pulmonary Route

- [x] Track length is 900 and the BP 100 target is 90 seconds.
- [x] Route order is right ventricle, pulmonary artery, alveolar capillary, pulmonary vein, left atrium／left ventricle.
- [x] Section ratios are 5, 25, 35, 25, and 10 percent.
- [x] Gas triggers remain within the 270～585 alveolar capillary range.
- [x] Pending/failed exchange keeps the blue-purple color; success changes downstream flow to red.
- [x] The pulmonary minimap route is continuous through right ventricle, lungs, left atrium, and left ventricle.

## Level 3 Upper Systemic Route

- [x] Track length is 1800 and the BP 100 target is 180 seconds.
- [x] Route contains left ventricle, aorta, carotid／subclavian arteries, upper arteriole, brain／upper capillary, venule, superior vena cava, and right heart.
- [x] Section ratios are 3, 12, 20, 15, 20, 10, 15, and 5 percent.
- [x] Gas triggers remain within the 900～1260 brain／upper-body capillary range.
- [x] The systemic oxygenated-to-deoxygenated gradient remains continuous.
- [x] The upper-systemic minimap route is continuous through left ventricle, brain, right atrium, and right ventricle.

## Level 4 High-Risk Route

- [x] Track length and route anatomy match Level 2 while using a separate level seed and minimap route ID.
- [x] Buff weight multiplier is 0.7.
- [x] General debuff multiplier is 2.5.
- [x] Alcohol adds 2x after the general multiplier for 5x total and weight 80.
- [x] High-BP Wound multiplier is 3.
- [x] Safe-BP Wound uses the exponential formula and BP 130 remains 0.5 percent per second.
- [x] Low BP uses only the existing low-BP handling path.

## Data And Geometry

- [x] All four levels pass schema validation and expose explicit start/end contracts.
- [x] Every section is distance-, color-, and minimap-contiguous.
- [x] All numeric control points, distances, radii, colors, seeds, timing, and multipliers live in `js/config.js`.
- [x] `levels.js` contains route semantics but no direct hexadecimal colors or gameplay-number tables.
- [x] Four Catmull-Rom tracks are built by the same `VesselTrack` class.
- [x] Visual curve lengths are 2938.231, 900.071, 1799.993, and 900.071.
- [x] Four target driving-time tests pass independently at 300, 90, 180, and 90 seconds.

## Reticles And Flight Instruments

- [x] The keyboard/body reticle is a warm cross with no circular border.
- [x] The mouse/view reticle is a separate cyan circle.
- [x] Neutral keyboard and mouse controls overlap only at the screen center and retain separate labels.
- [x] The body cross and ATTITUDE marker follow `lateralX`／`lateralY` only.
- [x] The view circle and VIEW needle follow Camera yaw／pitch only.
- [x] Mouse view does not mutate player distance, BP, or lateral offsets.
- [x] ATTITUDE displays signed X and Y local coordinates.
- [x] ALT minimum is 0 and maximum is the current vessel diameter.
- [x] At the initial left ventricle, ALT is 6.5 with a 13.0 diameter.
- [x] A 3.2-radius capillary changes the ALT maximum to 6.4.
- [x] VIEW displays normalized heading and signed pitch.

## HUD And Browser Acceptance

- [x] The Phase 08 title, overlay, README, browser test page, and workflow label identify the current phase.
- [x] At 1280 x 720, document scroll dimensions match the viewport.
- [x] The instrument cluster stays within the viewport at bottom 694.4 px.
- [x] The circulation map ends at 379.2 px and the instrument cluster starts at 549.7 px, so they do not overlap.
- [x] The existing status panel and KOSMOS TOOLKIT remain visible and unchanged.
- [x] Pointer Lock rejection enters PAUSED with distance 0 while Real Clock advances from 0.3 to 1.7 seconds.
- [x] Mobile Client Hint, iPhone, Android phone/tablet, and desktop-UA iPad cases remain rejected before controls are exposed.
- [x] Local and Pages game/test pages produce no application warning or error logs.

## Regression And Deployment

- [x] Shared Node suite: 169 passed, 0 failed.
- [x] Local Chromium shared suite: 169 passed, 0 failed.
- [x] All 64 JS/MJS files pass `node --check`; `git diff --check` passes.
- [x] No `setTimeout` or `setInterval` call exists under `js/`.
- [x] Local and Pages scenes initialize with Three.js r184, 22 draw calls, and 16,302 triangles.
- [x] GitHub Actions run 29379516466 passed `Run Phase 08 tests`, artifact upload, and Pages deployment for commit `c26fdaeb9f2b4efe453aed83a2021562d32bd16a`.
- [x] GitHub Pages serves P08 and its live shared suite reports 169 passed, 0 failed.

The automated Chromium environment cannot grant foreground Pointer Lock. A normal desktop-browser driving pass remains recommended for subjective reticle movement and instrument readability; the rejection path, timing, route data, geometry, input separation, and production ES Modules are covered here.

The PASS conclusion, defects, corrections, evidence, and residual risks are recorded in `reports/phase-08-report.md`.
