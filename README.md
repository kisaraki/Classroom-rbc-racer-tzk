# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 01 implements the single-vessel first-person driving prototype on top of
the Phase 00 contracts.

Included:

- Three.js scene, renderer, perspective camera, lighting, resize, and fog.
- One prototype Catmull-Rom vessel built from six overlapping TubeGeometry
  sections and a shared parallel-transport frame cache.
- Procedural vessel flow texture, biconcave PlayerRBC model, pixel RBC label,
  first-person nose, and independently controlled hood model.
- Local cross-section arrow-key movement and circular wall clamping.
- Config-driven Z/X blood-pressure adjustment and BP-to-speed mapping.
- Pointer Lock mouse yaw/pitch with vertical clamping and no vehicle effects.
- Basic HP, BP, Score, Location, distance, speed, and absolute-clock HUD.
- A RAF loop where world simulation stops in PAUSED while GameClock and HUD
  continue.
- A shared 50-test Node and browser suite, including deterministic Pointer Lock
  session and browser-event coverage.

Intentionally excluded until later phases:

- Formal level routes, LevelManager, level completion, and minimap data.
- General entities, spawning, collision effects, and object pools.
- QTE, low-BP stasis, alcohol, malaria, and Wound gameplay.
- Cutscenes, game-over, retry, ending, and victory flows.

Phase 01 code and automated tests are complete. Pointer Lock rejection now
starts the absolute deadline, pauses world simulation, keeps rendering active,
and preserves the browser error for diagnosis. The stage report remains
BLOCKED only because the available automated browser backends cannot perform
physical mouse capture; the positive foreground Pointer Lock plus Esc path
still requires one manual desktop-browser acceptance run. See
reports/phase-01-report.md for exact evidence.

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

Run the shared Phase 01 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 50 tests from tests/unit.
They include all Phase 00 regressions plus BP driving, input isolation, paused
RAF behavior, segmented vessel geometry, parallel-transport frames, PlayerRBC,
the independent hood, camera-only mouse look, and Pointer Lock session flow.

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
Three.js files with a CDN reference.

## Specifications

- TECHNICAL_DECISIONS.md contains the implementation contracts.
- PHASE_REPORT_TEMPLATE.md defines mandatory phase evidence.
- reports/ contains completed phase reports only after real tests.

The authoritative development brief is maintained one directory above this
project during local development.

## License

No license has yet been selected for the original RBC Racer project files.
Three.js remains under its upstream MIT License.
