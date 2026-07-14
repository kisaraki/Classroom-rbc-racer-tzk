# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 07 completes the alcohol-intoxication and malaria-obstruction systems on
top of the playable Level 1 vertical slice while retaining every Phase 00-06
behavior.

Included:

- The fifth alcohol collision starts one absolute 15-second intoxication
  deadline. Further alcohol still applies its normal Score/HP penalty but never
  extends the active deadline; natural completion resets the count and BP 100.
- Arrow and Z/X transitions use one timestamped queue instead of per-input
  timers. Each transition is delayed 250-700ms and has a 35% failure chance.
- BP is deterministically resampled in the 80-130 range once per 400ms update,
  without catch-up bursts after a hidden or late frame.
- Configured S sway affects the RBC only while world movement is permitted. A
  subtle procedural canvas distortion communicates intoxication without
  distorting the HUD.
- Malaria drives the independent hood from its original transform with two flap
  frequencies, roll, and vertical offset for five absolute seconds, followed by
  a 0.4-second restore. Repeated hits reset the same hood instead of adding one.
- Alcohol and malaria can overlap with separately calculated deadlines. The
  combined hood is capped at 55% configured coverage.
- QTE O/C input bypasses intoxication. Delayed driving actions that expire in
  QTE, PAUSED, transfer, or another disallowed state are discarded; low-BP
  stasis accepts delayed Z only.
- Rendering, HUD, status countdowns, malaria animation, and all real-time
  deadlines continue through QTE, low-BP stasis, PAUSED, and transfer. Game
  Over, Level Complete, and checkpoint retry clear every transient effect.
- The Phase 06 Gas Token, QTE retry/failed-pass behavior, exchange colors,
  Level Complete, terminal failures, and deterministic retry remain intact.
- The right status area now contains the always-available `KOSMOS TOOLKIT` /
  `探真拓知酷` keyboard and mouse guide, while active condition countdowns remain
  above it.
- A shared 158-test Node/browser suite plus 1280 x 720, 1920 x 1080, and
  390 x 844 layout acceptance.

Intentionally excluded until later phases:

- Playable Levels 2 through 4 and their data-driven route expansion (Phase 08).
- Inter-level cinematic content, complete endings, and victory flows. Level 4
  blood-pressure math remains tested as a contract but is not registered.
- Phase 10 long-duration performance and cross-browser acceptance.

Phase 07 local acceptance is PASS. Deployment evidence is recorded after the
implementation push in `reports/phase-07-report.md`; the matching acceptance
checklist is `tests/phase-07-manual-test-checklist.md`.

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

Run the shared Phase 07 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 158 tests from `tests/unit`.
They include every earlier regression plus fifth-hit intoxication, absolute
15-second expiry, delayed/failed input, state-aware queue disposal, 400ms BP
randomization, configured sway, continuous malaria flap/restore transforms,
55% overlap coverage, QTE coexistence, and cross-state deadline cleanup.
Earlier Gas QTE, BP, entity, collision, compact RBC, circulation map,
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
