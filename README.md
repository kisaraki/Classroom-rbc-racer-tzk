# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 02 replaces the prototype vessel with the data-driven first level:
the 3000-unit lower-body systemic circulation route.

Included:

- One generic LevelManager and one registered playable level. Levels 2 through
  4 remain unbuilt.
- A 3000-unit, 19-control-point Catmull-Rom route from the left ventricle to the
  right ventricle.
- Eight data-driven TrackSection instances with exact distances, Location
  labels, radii, arterial-to-venous vertex-color gradients, and overlap seams.
- Shared parallel-transport frames for geometry, the player, the camera, and
  local cross-section movement.
- Explicit route start/end contracts, gas-exchange trigger positions, and
  continuous SVG path progress data for the Phase 03 minimap.
- A procedural flow texture, biconcave PlayerRBC cockpit, Pointer Lock driving,
  dynamic Location HUD, and absolute clock retained from Phase 01.
- A shared 60-test Node and browser suite, including an unobstructed 300-second
  traversal of the complete first level.
- A 0.75 internal Three.js render scale that preserves the 1920 x 1080 layout
  while meeting the desktop performance requirement.

Intentionally excluded until later phases:

- Levels 2 through 4, level completion, and the rendered SVG minimap.
- General entities, spawning, collision effects, and object pools.
- QTE, low-BP stasis, alcohol, malaria, and Wound gameplay.
- Cutscenes, game-over, retry, ending, and victory flows.

Phase 02 is PASS. Local, desktop Chrome, GitHub Actions, GitHub Pages, and the
shared live browser suite all passed. Phase 03 is authorized but has not
started. See reports/phase-02-report.md for exact evidence.

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

- A current browser with native ES Module support.
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

Run the shared Phase 02 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 60 tests from tests/unit.
They include every Phase 01 regression plus first-level assembly, LevelManager
boundaries, Location changes, minimap progress, gas-trigger placement, route
start/end behavior, full baseline traversal, segmented vessel geometry, and
procedural vertex-color gradients.

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
