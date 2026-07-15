# Phase 10 Manual Test Checklist

## Gate

- [x] `reports/phase-09-report.md` was PASS before Phase 10 began.
- [x] The Phase 09 baseline was `181 passed, 0 failed`.
- [x] Phase 10 is the final implementation, optimization, test, and deployment stage.

## Gas Exchange Contract

- [x] Exchange opportunities exist only in sections marked `TISSUE` or `LUNG`.
- [x] Levels 1 and 3 expose 10 tissue opportunities each.
- [x] Levels 2 and 4 expose 20 lung opportunities each.
- [x] Trigger distances are strictly ordered and remain inside the configured exchange section.
- [x] No heart, ordinary artery, ordinary vein, route-end, or fallback QTE is created.
- [x] One successful opportunity sets the level exchange to `SUCCESS` and cancels later triggers.
- [x] A failed opportunity leaves the exchange `PENDING` while another opportunity remains.
- [x] Ten failed tissue opportunities set `FAILED` and still permit passage.
- [x] Twenty failed lung opportunities set `FAILED` and still permit passage.
- [x] Successful exchange toggles RBC red to red-purple and red-purple to red.
- [x] RBC color state survives level transitions and checkpoint retry.
- [x] Vessel reflection continues to tint both RBC color states.

## Timing And Interruption

- [x] Pointer Lock rejection enters `PAUSED` safely.
- [x] During a 3.1-second paused sample, REAL CLOCK advanced by 3.1 seconds.
- [x] During the same paused sample, simulation updates remained at zero.
- [x] During a tab-switch sample, REAL CLOCK advanced by 4.0 seconds.
- [x] During the same tab-switch sample, simulation updates remained at zero.
- [x] QTE input and result deadlines use absolute time and expire while paused.
- [x] Status effects, cooldowns, messages, and cutscenes retain absolute deadlines.
- [x] A hidden or delayed frame does not backfill world simulation or hazard rolls.
- [x] No runtime `setTimeout` or `setInterval` exists.

## Automated Regression

- [x] `npm run test:phase10` completed with 190 passed and 0 failed tests.
- [x] The Phase 10 compliance audit completed with 8 passed and 0 failed checks.
- [x] All 71 JavaScript and MJS files passed `node --check`.
- [x] `git diff --check` passed with no whitespace errors.
- [x] Fixed-seed generators reproduce entity and hazard sequences.
- [x] BP 100 simulations complete Levels 1 through 4 in 300, 90, 180, and 90 seconds.
- [x] All prior BP, Wound, collision, status, minimap, instrument, mobile refusal, cutscene, retry, and victory tests remain green.

## Resources And Limits

- [x] `VesselTrack.dispose()` releases owned Geometry, Material, and Texture resources.
- [x] `PlayerRBC.dispose()` releases body, cockpit, hood, label, and texture resources.
- [x] Procedural InstancedMesh batches release all owned resources.
- [x] Entity batches use configured capacity and reject an over-capacity update.
- [x] General active entities are capped at 24 and Wounds are capped at 2.
- [x] A 60-second Edge sample kept geometries at 39 and textures at 4.
- [x] The same sample grew used JS heap by only 0.325 MB against the 16 MB limit.
- [x] Draw calls remained at 22 against the limit of 30.
- [x] Triangles remained at 16,302 against the limit of 20,000.
- [x] Foreground in-app FPS was 42 to 54 against the minimum of 30.

## Browser Matrix

- [x] Deployed Chrome 150.0.7871.115 ran 190 of 190 tests successfully.
- [x] Deployed Edge 150.0.4078.65 ran 190 of 190 tests successfully.
- [x] Deployed Firefox 152.0.4 ran 190 of 190 tests successfully.
- [x] Chrome game viewport 1280 x 720 initialized without overflow or console errors.
- [x] Chrome game viewport 1920 x 1080 initialized without overflow or console errors.
- [x] Edge game viewport 1280 x 720 initialized without overflow or project console errors.
- [x] Edge game viewport 1920 x 1080 initialized without overflow or project console errors.
- [x] Firefox game viewport 1280 x 720 initialized without overflow or project console errors.
- [x] Firefox game viewport 1920 x 1080 initialized without overflow or project console errors.
- [x] Every browser reported Phase 10, `READY`, 22 draw calls, 16,302 triangles, 39 geometries, and 4 textures.
- [x] Firefox favicon MIME output was rechecked after using a valid inline SVG favicon and no longer occurs.

## Architecture And Compliance

- [x] Runtime code uses HTML5, CSS3, and Vanilla JavaScript ES Modules.
- [x] Four levels use one shared set of managers and systems.
- [x] Gameplay, balance, timing, color, distance, probability, and acceptance limits are centralized in `js/config.js`.
- [x] `levels.js` assembles semantic route data from `GAME_CONFIG.levels`.
- [x] There is no React, Vue, Angular, Phaser, Unity, backend, or database.
- [x] There is no external runtime image, model, video, font, media, or CDN reference.
- [x] Models, labels, minimap, textures, and animations remain procedural.
- [x] Three.js r184 is loaded from `vendor/three.module.js` with its local core dependency.
- [x] Three.js SHA-256 values and upstream MIT license match the recorded values.
- [x] Runtime and test imports remain relative and compatible with a GitHub Pages repository subpath.

## Deployment And Documentation

- [x] Implementation commit `71b43b22ae5d2828c58fe1c34e0df79dba2331d1` was pushed to `main`.
- [x] GitHub Actions run `29383460559` passed build, audit, artifact, and deploy jobs.
- [x] The deployed game returned HTTP 200 and contained the Phase 10 release token.
- [x] The deployed browser test page returned HTTP 200 and passed in Chrome, Edge, and Firefox.
- [x] README documents controls, requirements, local start, tests, limits, deployment, and vendor integrity.
- [x] `TECHNICAL_DECISIONS.md` and the development brief contain the final gas exchange and RBC color decisions.
- [x] The original project has no selected license; README states that explicitly while preserving the Three.js MIT license.

## Environment Limitations

- Automated Pointer Lock cannot reliably retain a foreground lock. The real rejection path, paused clock, tab interruption, and zero-delta behavior were browser-tested; successful lock and resume transitions are covered by the shared unit suite.
- Firefox WebDriver uses headless software WebGL and background frame throttling, so its 4 to 6 FPS reading is not used as a hardware performance result. Firefox compatibility, rendering initialization, layout, tests, and project console output all passed.
- Safari, Windows 11, macOS, phones, and tablets are not part of this Windows 10 primary-browser matrix. Phones and tablets are intentionally refused by product design.
