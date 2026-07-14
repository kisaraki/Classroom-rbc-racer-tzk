# Phase 01 Manual Test Checklist

Tested on 2026-07-14 with Google Chrome 150.0.7871.115 and the Codex
In-app Browser through local HTTP servers.

## Stage Gate

- [x] `reports/phase-00-report.md` is PASS.
- [x] Formal levels, entities, collision, QTE, status effects, minimap,
  cutscenes, and endings remain unimplemented.

## Loading And Rendering

- [x] The root page loads through HTTP with no console warning or error.
- [x] READY renders a Three.js r184 canvas without automatically requesting
  Pointer Lock.
- [x] The scene contains six TubeGeometry sections, 1,025 cached frames, one
  procedural flow texture, and an independent hood.
- [x] The first-person RBC nose, trim, and procedural RBC letters are visible.
- [x] The exact start label is `開始遊戲並鎖定滑鼠視角`.
- [x] At READY, ArrowRight and Z leave distance, BP, and world-update count
  unchanged.

## Pointer Lock And Pause

- [x] Clicking the start button calls Pointer Lock only after that user action.
- [x] A rejected Pointer Lock request enters PAUSED without a world update,
  starts the absolute timer, keeps Renderer/HUD active, records the browser
  error, and shows a retryable message.
- [x] Deterministic browser-event tests cover successful capture, release,
  rejection deduplication, retry, and unsupported API behavior.
- [x] A foreground desktop browser successfully enters Pointer Lock, advances
  the vessel, and accepts mouse yaw/pitch.
- [x] Pressing Esc after successful capture enters PAUSED, shows
  `點擊恢復遊戲`, keeps distance fixed, increases the `T+` Real Clock,
  decreases the internal absolute deadline, and continues Renderer/HUD frames.

The user confirmed successful desktop capture and the corrected `T+` Real
Clock after deployment. All Phase 01 manual acceptance items are complete.

## Resolution And Deployment

- [x] 1280 x 720 has no horizontal or vertical overflow.
- [x] 1920 x 1080 has no horizontal or vertical overflow.
- [x] 390 x 844 keeps the start flow readable with no horizontal overflow.
- [x] The test page remains readable at narrow width and reports 51 PASS.
- [x] `/rbc-racer/` project-subpath loading resolves all relative assets.
- [x] `/rbc-racer/tests/unit-test.html` reports 51 passed and 0 failed.
- [x] The public GitHub Pages root returns HTTP 200 and renders Three.js r184,
  six vessel sections, 1,025 cached frames, and 13,860 triangles.
- [x] The public GitHub Pages test page reports 51 passed and 0 failed with no
  horizontal overflow.
- [x] Runtime HTML, CSS, and JavaScript reference no remote image, model,
  video, font, CDN, backend, or database.

Evidence and the PASS conclusion are recorded in
`reports/phase-01-report.md`.
