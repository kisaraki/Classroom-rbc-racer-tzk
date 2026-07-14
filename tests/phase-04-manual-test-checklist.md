# Phase 04 Manual Test Checklist

## Scope Gate

- [x] Phase 03 was PASS before Phase 04 work began.
- [x] Only Level 1 remains registered and playable.
- [x] Wound probability/spawning, Gas QTE, level completion, intoxication
  steering, full malaria flutter, cutscenes, and endings were not added.
- [x] Phase 04 provides the Wound model and fatal collision contract only;
  general weighted spawning never contains Wound.

## Procedural Assets

- [x] C, B12, Fe²⁺, CO, malaria, C₂H₅OH, and Wound each have a
  configured procedural model.
- [x] Exact labels are produced with CanvasTexture and Sprite; malaria has no
  label and uses an irregular core, loop, and spikes.
- [x] Every model part is rendered through an InstancedMesh batch.
- [x] No external image, model, video, font, CDN, backend, or database is used.

## Spawn And Pooling

- [x] Two managers with the Level 1 seed produce identical 249-slot schedules.
- [x] Longitudinal gaps remain in the configured 8-16 range and satisfy the
  explicit minimum-gap contract.
- [x] Cross-section radius uses `sqrt(random)` and remains inside the vessel.
- [x] Gas/QTE trigger distances and the endpoint reserve empty reaction space.
- [x] The same debuff cannot appear more than twice consecutively.
- [x] Automatic entities activate 35-70 units ahead and stale entities recycle
  20 units behind.
- [x] Consumed state objects are reused by identity from the object pool.
- [x] General entities cap at 24; Wound uses a separate cap of 2.
- [x] Passing an unconsumed Wound records exactly one dodge.

## Collision And Effects

- [x] Swept longitudinal collision catches an entity crossed in one frame.
- [x] Circular cross-section collision rejects a lateral near miss.
- [x] Same-frame order is Wound, debuffs, HP depletion, then buffs; equal
  priorities use distance then stable ID.
- [x] C, B12, and Fe²⁺ apply Score +1 / HP +1 with HP clamping.
- [x] CO, malaria, and alcohol apply their configured Score/HP penalties.
- [x] Alcohol increments `player.alcoholCount` without Phase 07 steering.
- [x] Wound applies Score -200, reports fatal, and does not subtract HP first.
- [x] Malaria raises the independent hood for five absolute seconds; a repeat
  hit refreshes the deadline and expiry works without simulation updates.

## Browser, Layout, And Deployment

- [x] Node shared suite: 101 passed, 0 failed.
- [x] Local browser shared suite: 101 passed, 0 failed.
- [x] Local 1280 x 720 render: P04, Three.js r184, 7 batches, 249 slots,
  3 active entities, 61 FPS, and no warning/error logs.
- [x] Live 1920 x 1080 render has no document overflow and all measured HUD
  panels remain inside the viewport.
- [x] Live 390 x 844 render has no horizontal overflow and the P04 overlay
  remains inside the viewport.
- [x] Pointer Lock rejection pauses world distance while the real clock keeps
  advancing from 16.3 to 17.5 seconds.
- [x] GitHub Actions run 29343722936 passed its build/test and deploy jobs.
- [x] GitHub Pages serves P04 and the live shared suite reports 101/101 with no
  application console warning or error.

The PASS conclusion and evidence are recorded in
`reports/phase-04-report.md`.
