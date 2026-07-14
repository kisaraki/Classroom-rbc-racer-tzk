# RBC Racer

RBC Racer is a browser-based red-blood-cell circulation racer. The project uses
HTML5, CSS3, Vanilla JavaScript ES Modules, and a locally vendored Three.js
build. It has no runtime backend, database, framework, CDN, or external media.

## Current Phase

Phase 05 adds deterministic blood-pressure hazards and subtle vessel-color
reflection to the data-driven first level while retaining all Phase 04 entity,
collision, circulation HUD, compact RBC, and desktop-only startup behavior.

Included:

- One deterministic blood-pressure check per real-clock second while PLAYING;
  paused and stasis time never backfills missed world-hazard checks.
- Levels 1-3 produce Wound only above BP 130. Level 4 uses the configured
  exponential formula from BP 80 through 130, then applies its x3 multiplier
  above 130, with the configured 45% per-second cap.
- BP-triggered Wounds appear 35-70 units ahead, respect gas/end/entity
  reservations, maintain a 45-unit Wound gap, and share the existing two-Wound
  cap, pooling, dodge, collision, and fatal-effect contracts.
- BP below 80 uses `min(35%, (80 - BP) * 2.5%)` once per second. A successful
  roll creates five seconds of `LOW_BP_STASIS`, followed by a ten-second
  absolute cooldown.
- During stasis, track flow, distance, lateral movement, entity generation,
  animation, and collision are frozen. Rendering, HUD updates, the real clock,
  and Z-only BP recovery continue; X is ignored even when held with Z.
- Stasis and cooldown deadlines continue while paused, and stasis expiry while
  paused safely changes the eventual resume target back to PLAYING.
- The procedural RBC body and cockpit sample the current vessel-section color
  gradient every render frame. Configured low-strength color/emissive blending
  and exponential response produce a smooth, subtle arterial/venous reflection
  without external textures or environment maps.
- HUD warnings, status countdowns, and `data-*` diagnostics expose probabilities,
  checks, trigger counts, deadlines, Wound counts, and reflected colors.
- All earlier procedural entities, collision rules, compact RBC/label,
  circulation map, desktop-only startup gate, Pointer Lock controls, and
  continuously running real clock remain intact.
- A shared 125-test Node/browser suite plus 1280 x 720, 1920 x 1080, and
  390 x 844 layout acceptance.

Intentionally excluded until later phases:

- Gas-exchange QTE, failed-pass handling, and level completion (Phase 06).
- Full alcohol intoxication steering and continuous malaria hood flutter
  animation (Phase 07). Their existing base Score/HP effects remain unchanged.
- Playable Levels 2 through 4, cutscenes, game-over, retry, endings, and victory
  flows. Level 4 blood-pressure math is implemented and tested as a data-driven
  contract, but the level is not yet registered for play.

Phase 05 is PASS. Local Node/browser acceptance, GitHub Actions, GitHub Pages,
and the live 125-test suite all passed. See `reports/phase-05-report.md` for the
complete evidence and `tests/phase-05-manual-test-checklist.md` for the
acceptance checklist.

## Controls

| Input | Action |
| --- | --- |
| Arrow keys | Move in the vessel's local cross-section |
| Z | Raise BP and increase speed; remains active during low-BP stasis |
| X | Lower BP and decrease speed; ignored during low-BP stasis |
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

Run the shared Phase 05 suite with either command:

~~~powershell
npm test
~~~

~~~powershell
node ./tests/run-tests.mjs
~~~

The browser page and Node runner import the same 125 tests from `tests/unit`.
They include every earlier regression plus high/low-BP formula boundaries,
once-per-second scheduling, pause behavior, absolute stasis/cooldown deadlines,
Z-only recovery, Level 4 multipliers, safe Wound placement, and smooth
arterial/venous RBC reflection. Earlier entity, collision, compact RBC/label,
circulation map, desktop/mobile detection, and refusal-screen contracts remain
covered by the same suite.

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
