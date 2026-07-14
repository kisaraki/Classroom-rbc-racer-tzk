# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 04 adds procedural gameplay entities and deterministic collision handling
to the data-driven first level while retaining the Phase 03 circulation HUD.

Included:

- Seven fully procedural models: C, B12, Fe²⁺, CO, malaria, C₂H₅OH, and
  Wound. No image, model, video, font, or network asset is loaded.
- CanvasTexture/Sprite labels with exact Unicode text; malaria intentionally
  uses an irregular core, loops, and spikes without a text label.
- One InstancedMesh batch per entity type, pooled entity state objects, a
  24-general-entity cap, and a separate two-Wound cap.
- A deterministic level-seeded schedule with configured 8-16 unit spacing,
  weighted empty slots, uniform-area cross-section placement, reserved gas/QTE
  distances, and no more than two identical consecutive debuffs.
- Activation 35-70 units ahead and recycling 20 units behind the player.
- Swept longitudinal collision over the previous/current frame plus circular
  cross-section tests, preventing high-speed tunnelling.
- Stable same-frame priority: Wound, debuffs, HP depletion, then buffs. Wound
  applies Score -200 and reports fatal without subtracting HP first.
- Working Score/HP effects for nutrients, CO, malaria, and alcohol; alcohol
  also increments the canonical player counter.
- A basic five-second malaria hood obstruction driven by an absolute deadline,
  so it expires while world simulation is paused.
- A 15% smaller procedural RBC body and matching collision radius, providing
  more avoidance room without changing track or entity dimensions.
- A compact RBC label whose display plane matches the procedural 25:13 texture
  ratio and remains fully inside the first-person camera view.
- A desktop-only startup gate. Mobile Client Hints, mobile user agents, Android
  tablets, and desktop-UA iPads receive a refusal screen before the game module
  or Three.js scene is loaded.
- The Phase 03 3000-unit lower systemic route, SVG circulation map, HUD,
  Pointer Lock controls, and continuously running real clock remain intact.
- A shared 109-test Node/browser suite plus 1280 x 720 desktop and 390 x 844
  narrow-desktop layout acceptance.

Intentionally excluded until later phases:

- Automatic Wound probability/spawning and BP-dependent Wound frequency
  (Phase 05). The model, pool lane, dodge counter, and fatal collision contract
  are ready but the first level does not generate Wound yet.
- Gas-exchange QTE, failed-pass handling, and level completion (Phase 06).
- Full alcohol intoxication steering and continuous malaria hood flutter
  animation (Phase 07). Phase 04 applies their base Score/HP effects only.
- Levels 2 through 4, cutscenes, low-BP stasis, game-over, retry, endings, and
  victory flows.

Phase 04 is PASS. Local Node/browser acceptance, GitHub Actions, GitHub Pages,
and the live 109-test suite all passed. See `reports/phase-04-report.md` for the
phase evidence and `reports/phase-04-rbc-mobile-correction-report.md` for the
post-acceptance RBC/mobile correction.

## Controls

| Input | Action |
| --- | --- |
| Arrow keys | Move in the vessel's local cross-section |
| Z | Raise BP and increase speed |
| X | Lower BP and decrease speed |
| Mouse | Change yaw and pitch only |
| Esc | Release Pointer Lock and pause world simulation |

WASD, mouse buttons, the wheel, and trackpad gestures never control the RBC.

## Requirements

- A current desktop browser with native ES Module and Pointer Lock support,
  plus a keyboard and mouse. Phones and tablets are intentionally blocked.
- Node.js for command-line unit tests.
- Python 3 or another static HTTP server for browser testing.

No package installation or build step is required.

## Live Site

- Game: https://kisaraki.github.io/Classroom-rbc-racer-tzk/
- Shared browser tests:
  https://kisaraki.github.io/Classroom-rbc-racer-tzk/tests/unit-test.html

The site is deployed from `main` by `.github/workflows/deploy-pages.yml` after
the shared test suite passes.

## Local Start

From the project directory:

~~~powershell
python -m http.server 8000
~~~

Open:

- Driving prototype: http://127.0.0.1:8000/
- Browser tests: http://127.0.0.1:8000/tests/unit-test.html

Do not open index.html through file:// because browser ES Module security rules
require an HTTP server.

## Automated Tests

Run the shared Phase 04 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 109 tests from `tests/unit`.
They include every earlier regression plus all seven procedural models, exact
labels, InstancedMesh batching, deterministic schedules, fairness and spacing,
reserved slots, object pooling/caps, swept collision, collision priority,
Score/HP clamping, alcohol counting, Wound fatal semantics, and absolute
malaria-hood deadlines. The suite also verifies compact RBC clearance, label
aspect/projection bounds, desktop support, mobile Client Hints and user agents,
iPadOS detection, and the refusal screen's no-initialization state.

## Three.js Vendor Record

Pinned release: r184, package version 0.184.0.

Official source:

- https://github.com/mrdoob/three.js/tree/r184
- https://raw.githubusercontent.com/mrdoob/three.js/r184/build/three.module.js
- https://raw.githubusercontent.com/mrdoob/three.js/r184/build/three.core.js
- https://raw.githubusercontent.com/mrdoob/three.js/r184/LICENSE

Integrity:

| File | SHA-256 |
| --- | --- |
| vendor/three.module.js | 61134198639a10885daf893fb29669ca26386e2a4cde76e8399f51e329f741f2 |
| vendor/three.core.js | 368dc78835287709a48939e8eb9a7a61d0732098bdf916e56840d458aae9ccf3 |
| vendor/THREE-LICENSE.txt | 8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc |

In r184, three.module.js is the public WebGL entry and imports the sibling
three.core.js module. Both files are required for local and GitHub Pages use.
The upstream MIT license is preserved at vendor/THREE-LICENSE.txt.

To verify the files in PowerShell:

~~~powershell
Get-FileHash -Algorithm SHA256 vendor/three.module.js
Get-FileHash -Algorithm SHA256 vendor/three.core.js
Get-FileHash -Algorithm SHA256 vendor/THREE-LICENSE.txt
~~~

## GitHub Pages

index.html is at the deployment root. Runtime imports, stylesheets, links, and
test resources use relative paths, so the same files work from the repository
subpath at https://kisaraki.github.io/Classroom-rbc-racer-tzk/.

The Pages workflow deploys this directory without replacing the vendored
Three.js files with a CDN reference. Entry styles and ES Module paths use a
release query token so a newly deployed UI does not reuse an older GitHub Pages
asset from the browser cache.

## Specifications

- TECHNICAL_DECISIONS.md contains the implementation contracts.
- PHASE_REPORT_TEMPLATE.md defines mandatory phase evidence.
- reports/ contains completed phase reports only after real tests.

The authoritative development brief is maintained one directory above this
project during local development.

## License

No license has yet been selected for the original RBC Racer project files.
Three.js remains under its upstream MIT License.
