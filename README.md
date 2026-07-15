# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 09 connects the four data-driven circulation routes into one complete
run while retaining every Phase 00-08 behavior.

Included:

- Levels 1 through 3 automatically load the next route after a four-second
  heart-chamber conveyor. Level 4 continues through its left-atrium-to-left-
  ventricle transfer and then starts the victory sequence.
- Transfer semantics remain level data: Levels 1 and 3 use right atrium to
  right ventricle; Levels 2 and 4 use left atrium to left ventricle.
- HP depletion plays the procedural Spleen/Liver recycle factory. Wound plays
  the vessel-rupture fall for Levels 1, 2, and 4, and the dedicated Stroke
  ending for the Level 3 brain route.
- Victory procedurally builds a bright arterial tunnel, six-RBC parade, O2
  flag, and 36 confetti strips before presenting final run statistics.
- Failure menus expose retry-current-level, restart-from-Level-1, and return-
  to-main-menu actions. Victory exposes restart and main-menu actions.
- Level retry preserves checkpoint seed and score, applies the configured
  minimum HP, and clears BP, position, QTE, intoxication, malaria, entities,
  delayed input, low-BP state, and pending transitions.
- Cross-level loading preserves current HP and score while creating a new
  checkpoint from the next level's fixed seed. All four routes still use the
  shared managers and systems without level-specific class forks.
- Every cutscene uses absolute deadlines. The render loop, REAL CLOCK, status
  effects, cooldowns, and animations continue while world movement is frozen.
- A shared 181-test Node/browser suite covers all earlier contracts plus the
  five cutscene timelines, four heart transfers, sequential loading, Stroke,
  victory state, checkpoint retry, and transient-state clearing.

Intentionally excluded until later phases:

- Phase 10 long-duration performance and cross-browser acceptance.

The application starts on Level 1. If Pointer Lock remains active, inter-level
loading continues automatically. If the user releases Pointer Lock during a
transfer, the next route is still loaded automatically but waits for the next
user click before browser security allows mouse recapture.

Phase 09 acceptance evidence is recorded in `reports/phase-09-report.md`; the
matching checklist is `tests/phase-09-manual-test-checklist.md`.

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
- Cutscene preview: http://127.0.0.1:8000/tests/phase-09-cutscene-preview.html

Do not open index.html through file:// because browser ES Module security rules
require an HTTP server.

## Automated Tests

Run the shared Phase 09 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 181-test suite from
`tests/unit`. It includes every earlier regression plus five absolute-time
cutscene timelines, sequential route loading, all four chamber transfers,
retry state construction, dedicated Stroke and victory states, route geometry,
target driving times, status effects, Gas QTE, BP, entity, collision, compact
RBC, desktop/mobile detection, and refusal-screen contracts.

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
