# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 08 expands the circulation course into four data-driven level datasets
while retaining every Phase 00-07 behavior.

Included:

- Level 1 retains its 3000-unit lower-body systemic route and 300-second target.
- Level 2 adds a 900-unit pulmonary route with right-heart, pulmonary artery,
  alveolar capillary, pulmonary vein, and left-heart sections.
- Level 3 adds an 1800-unit upper-body and brain systemic route with its own
  artery, capillary, venous, radius, color, and gas-exchange mappings.
- Level 4 reuses the pulmonary anatomy through a separate high-risk dataset.
  Buff weights use 0.7x, general debuffs use 2.5x, alcohol adds 2x for 5x total,
  and high-BP Wound chance uses 3x. Safe-BP Wound retains the exponential rule.
- All numeric control points, distances, radii, colors, seeds, timings, and
  multipliers remain centralized in `js/config.js`. `js/data/levels.js` adds
  only route semantics and assembles all four levels through one code path.
- The procedural circulation map now exposes four route IDs over the existing
  eight vessel curves and seven anatomical nodes.
- The cockpit HUD separates controls: a warm cross shows keyboard-controlled
  body attitude, while a cyan circle shows mouse-controlled view direction.
- ATTITUDE, dynamic ALT, and VIEW panels report local body offset, a 0-to-vessel
  diameter altitude scale, mouse heading, and mouse pitch.
- A shared 169-test Node/browser suite covers every route, location, color
  boundary, minimap mapping, gas-exchange zone, visual curve, risk multiplier,
  instrument, and all four target driving times.

Intentionally excluded until later phases:

- Automatic inter-level transitions and heart-chamber conveyor cutscenes.
- Recycle, fall, stroke, and victory ending expansion plus whole-run restart.
- Phase 10 long-duration performance and cross-browser acceptance.

The application still starts on Level 1; Phase 09 owns automatic progression.
All four Phase 08 datasets are registered and loadable by the shared
`LevelManager`, `VesselTrack`, entity, gas exchange, and minimap systems.

Phase 08 acceptance evidence is recorded in `reports/phase-08-report.md`; the
matching checklist is `tests/phase-08-manual-test-checklist.md`.

## Controls

| Input | Action |
| --- | --- |
| Arrow keys | Move in the vessel's local cross-section |
| Z | Raise BP and increase speed; remains active during low-BP stasis |
| X | Lower BP and decrease speed; ignored during low-BP stasis |
| O | Add oxygen during an active gas-exchange QTE |
| C | Remove carbon dioxide during an active gas-exchange QTE |
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

Run the shared Phase 08 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 169-test suite from
`tests/unit`. It includes every earlier regression plus four-level schema
assembly, exact route locations, section continuity, gas zones, four minimap
paths, four Catmull-Rom tracks, target driving times, Level 4 weights, and
flight-instrument mapping.
Earlier status effects, Gas QTE, BP, entity, collision, compact RBC,
desktop/mobile detection, and refusal-screen contracts remain covered.

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
