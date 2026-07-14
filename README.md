# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 06 completes the first playable vertical slice with a procedural gas
exchange QTE, first-level completion, terminal failures, and deterministic
checkpoint retry while retaining every Phase 00-05 behavior.

Included:

- A programmatic `O₂ / CO₂` Gas Token appears at the Level 1 tissue-capillary
  trigger. Crossing is longitudinal and unavoidable regardless of lateral
  position, with a configured fallback before the route end.
- QTE enters a world-frozen state while rendering, HUD, the real clock, and all
  absolute deadlines continue. Only non-repeating O and C input is accepted.
- Each attempt lasts 1.5 seconds and requires three O plus three C presses in
  any order. Success adds 10; each failure subtracts 3; the result remains
  visible for 0.8 seconds.
- The first failure preserves `PENDING` and exposes one retry token. A second
  failure records `FAILED` but still permits completion, as required.
- Successful exchange reveals the configured tissue-to-venous vessel gradient;
  pending or failed exchange retains the pre-exchange color. RBC environment
  reflection continues sampling the live vessel color.
- Level 1 now reaches `TRANSFER_CUTSCENE` and `LEVEL_COMPLETE`. Wound enters
  `GAME_OVER_FALL`; HP depletion enters `GAME_OVER_RECYCLE`.
- Level completion and both game-over screens can rebuild Level 1 from its
  checkpoint with at least the configured retry HP, initial BP, cleared input
  and statuses, and the same deterministic entity seed.
- The right status area now contains the always-available `KOSMOS TOOLKIT` /
  `探真拓知酷` keyboard and mouse guide, while active condition countdowns remain
  above it.
- All earlier BP hazards, low-BP stasis, procedural entities, collisions,
  compact RBC, circulation map, desktop-only startup gate, and continuously
  running timers remain intact.
- A shared 145-test Node/browser suite plus 1280 x 720, 1920 x 1080, and
  390 x 844 layout acceptance.

Intentionally excluded until later phases:

- Full alcohol intoxication steering and continuous malaria hood flutter
  animation (Phase 07). Their existing base Score/HP effects remain unchanged.
- Playable Levels 2 through 4, inter-level cinematic content, endings, and
  victory flows. Level 4 blood-pressure math remains tested as a data-driven
  contract but is not registered for play.
- Phase 10 long-duration performance and cross-browser acceptance.

Phase 06 local acceptance is PASS. Deployment evidence is recorded after the
implementation push in `reports/phase-06-report.md`; the matching acceptance
checklist is `tests/phase-06-manual-test-checklist.md`.

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

Run the shared Phase 06 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 145 tests from `tests/unit`.
They include every earlier regression plus longitudinal/fallback gas triggers,
O/C thresholds, first-failure retry, second-failure pass, absolute QTE result
deadlines, state transitions, checkpoint reset, exchange-gated vessel colors,
the procedural Gas Token, and QTE hood behavior. Earlier BP, entity, collision,
compact RBC, circulation map, desktop/mobile detection, and refusal-screen
contracts remain covered by the same suite.

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
