# RBC Racer

RBC Racer is a desktop browser game that models a red blood cell travelling
through four data-driven circulation routes. It uses HTML5, CSS3, Vanilla
JavaScript ES Modules, and a locally vendored Three.js build. All 3D models,
labels, minimap graphics, textures, and animations are generated at runtime.

## Final Build

Phase 10 completes the implementation, regression suite, compatibility audit,
performance acceptance, documentation, and GitHub Pages deployment.

The complete run contains:

- Level 1 systemic circulation through the abdomen and lower limbs, Level 2
  pulmonary circulation, Level 3 systemic circulation through the head, chest,
  and upper limbs, and Level 4 pulmonary circulation with a high-risk gameplay
  modifier.
- Shared managers and systems for every route. Level-specific behavior remains
  data in `js/config.js` and `js/data/levels.js` rather than class forks.
- Gas-exchange opportunities only inside systemic capillary beds or pulmonary
  alveolar capillaries. Systemic routes contain 10 evenly spaced
  opportunities; pulmonary routes contain 20.
- One completed gas QTE is enough to mark the exchange successful and remove
  every remaining opportunity. If all opportunities fail, the route still
  permits progression with the configured score penalties.
- Successful exchange toggles the RBC body between its original red
  oxygenated-blood state (充氧血) and a red-purple deoxygenated-blood state
  (減氧血). The state is preserved across route changes and checkpoints while
  still receiving subtle vessel-color reflection.
- Absolute QTE, status-effect, cooldown, cutscene, and real-clock deadlines.
  These continue through Pointer Lock release, pause, and tab interruption;
  world simulation does not catch up after a hidden tab returns.
- Heart-chamber transfers, recycle, fall, Stroke, victory, retry-current-level,
  restart-run, and main-menu flows from Phase 09.
- Procedural InstancedMesh entity batches, pooling, active-entity limits,
  explicit Geometry/Material/Texture disposal, and centralized performance
  limits.

Final acceptance evidence is in `reports/phase-10-report.md`. The reproducible
manual matrix is in `tests/phase-10-manual-test-checklist.md`.

## Controls

| Input | Action |
| --- | --- |
| Arrow keys | Move in the vessel's local cross-section |
| Z | Raise BP and increase speed; remains active during low-BP stasis |
| X | Lower BP and decrease speed; ignored during low-BP stasis |
| O | Perform the oxygen step during an active gas-exchange QTE |
| C | Perform the carbon-dioxide step during an active gas-exchange QTE |
| Mouse | Change view yaw and pitch without moving the RBC |
| Esc | Release Pointer Lock and pause world simulation |

WASD, mouse buttons, the wheel, and trackpad gestures do not control the RBC.

## Requirements

- A current desktop Chrome, Edge, or Firefox browser with ES Module, WebGL, and
  Pointer Lock support, plus a keyboard and mouse.
- A viewport of at least 1280 x 720. The reference desktop viewport is
  1920 x 1080.
- Node.js only when running command-line tests.
- Python 3 or any static file server only when testing locally.

Phones and tablets are intentionally detected and refused before Three.js is
loaded. No package installation, transpilation, bundling, backend, database,
CDN, framework, or runtime build step is required.

## Biology Terminology

Traditional Chinese circulation terminology follows
`選修生物(Ⅲ)備課用書_03_CH2_循環與消化(114f640061).pdf`, identified by
SHA-256
`0CE4CBA49040595EAD5E8202AFB87236148469822C1B25A7DB4B277777E51D14`.
The canonical project vocabulary and textbook page evidence are recorded in
`CIRCULATION_TERMINOLOGY.md`.

Player-visible labels use `體循環`, `肺循環`, `充氧血`, `減氧血`,
`微血管`, and `肺泡微血管`. Stable internal English identifiers such as
`SYSTEMIC`, `PULMONARY`, `TISSUE`, `LUNG`, `oxygenated`, and
`deoxygenated` remain implementation contracts and must map to those
textbook terms.

## Rebuild and AI Handoff

The repository includes the complete contracts needed for a clean-machine
restore, maintenance handoff, or an explicitly requested clean-room rebuild:

- `classroom-rbc-racer-tzk.md`: version 3.1 master game, architecture, medical,
  acceptance, and rebuild specification.
- `CIRCULATION_TERMINOLOGY.md`: textbook-backed Traditional Chinese
  circulation terminology and internal-ID mappings.
- `codex-devp-cmd.md`: mode-based RESTORE / MAINTAIN / REBUILD instructions for
  another AI, Codex version, or developer.
- `TECHNICAL_DECISIONS.md`: resolved timing, route, QTE, BP, checkpoint, and
  data-ownership decisions.
- `PHASE_REPORT_TEMPLATE.md` and `reports/`: verification format and historical
  Phase 00-10 evidence.

For an existing or freshly cloned completed repository, run
`npm run test:phase10` and preserve the implementation. Do not replay Phase
00-10 unless the source is genuinely unavailable or the user explicitly asks
for a clean-room rebuild. Presentation files, screenshots, recordings, browser
profiles, and other non-runtime evidence belong in a sibling `../deliverables/`
directory rather than this GitHub Pages deployment root.

## Live Site

- Game: https://kisaraki.github.io/Classroom-rbc-racer-tzk/
- Browser regression suite:
  https://kisaraki.github.io/Classroom-rbc-racer-tzk/tests/unit-test.html

GitHub Pages deploys from `main` through
`.github/workflows/deploy-pages.yml` only after the Phase 10 regression suite
and compliance audit pass.

## Local Start

From this directory:

```powershell
python -m http.server 8000
```

Open:

- Game: http://127.0.0.1:8000/
- Browser tests: http://127.0.0.1:8000/tests/unit-test.html
- Cutscene preview:
  http://127.0.0.1:8000/tests/phase-09-cutscene-preview.html

Do not open `index.html` with `file://`; browser ES Module security requires an
HTTP server.

## Automated Tests

Run the complete Phase 10 gate:

```powershell
npm run test:phase10
```

Individual commands:

```powershell
npm test
npm run test:audit
```

The shared Node/browser suite currently contains 190 tests. It covers all four
routes, 10/20 gas opportunities, one-success completion, red/red-purple state
and checkpoint preservation, timing and paused expiry, state transitions,
resource disposal, InstancedMesh pooling, active limits, fixed seeds, driving
times, BP, collisions, status effects, mobile refusal, cutscenes, and retry.

The Node-only audit verifies:

- No external runtime media, fonts, models, video, CDN, framework, backend, or
  database dependency.
- Relative GitHub Pages paths and shared Vanilla ES Module imports.
- Centralized frozen tuning, no interval timers, and no level-specific core
  forks.
- Three.js r184 files, SHA-256 values, and the preserved MIT license.

## Performance Limits

Acceptance values are centralized in `GAME_CONFIG.performanceAcceptance`:

| Metric | Limit |
| --- | ---: |
| Sustained FPS | At least 30 |
| Draw calls | At most 30 |
| Triangles | At most 20,000 |
| Long-run sample | 60 seconds |
| JS heap growth during sample | At most 16 MB where measurable |

Actual browser results and measurement limitations are recorded in the Phase
10 report rather than inferred from configuration alone.

## Three.js Vendor Record

Pinned release: r184, package version 0.184.0.

Official source:

- https://github.com/mrdoob/three.js/tree/r184
- https://raw.githubusercontent.com/mrdoob/three.js/r184/build/three.module.js
- https://raw.githubusercontent.com/mrdoob/three.js/r184/build/three.core.js
- https://raw.githubusercontent.com/mrdoob/three.js/r184/LICENSE

| File | SHA-256 |
| --- | --- |
| `vendor/three.module.js` | `61134198639a10885daf893fb29669ca26386e2a4cde76e8399f51e329f741f2` |
| `vendor/three.core.js` | `368dc78835287709a48939e8eb9a7a61d0732098bdf916e56840d458aae9ccf3` |
| `vendor/THREE-LICENSE.txt` | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |

In r184, `three.module.js` is the public WebGL entry and imports the sibling
`three.core.js`. Both files are required. The upstream MIT license is preserved
in `vendor/THREE-LICENSE.txt`.

## Project License

No license has been selected for the original RBC Racer project files; all
rights are reserved. Three.js remains under its upstream MIT License.
