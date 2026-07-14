# Phase 02 Manual Test Checklist

## Scope Gate

- [x] `reports/phase-01-report.md` is PASS before Phase 02 work begins.
- [x] Only Level 1 is registered in `LEVELS`.
- [x] Levels 2 through 4 still have no control points or playable routes.
- [x] No entity, collision, QTE, status-effect, cutscene, completion, or ending
  runtime was added.

## Level Data

- [x] Level 1 uses a 3000-unit route and a 300-second BP 100 baseline.
- [x] Nineteen control points are stored in `GAME_CONFIG.levels[1]`.
- [x] Eight contiguous sections cover distances 0 through 3000.
- [x] Section Location labels follow the required lower-body systemic route.
- [x] Section radii are 6.5, 5.5, 5.0, 4.0, 3.2, 3.8, 5.5, and 6.5.
- [x] Primary, retry, and fallback gas positions remain inside the tissue
  capillary section.
- [x] SVG path progress is continuous from 0 through 1.

## Geometry And Driving

- [x] The route uses CatmullRomCurve3 and eight overlapping TubeGeometry
  sections.
- [x] Every section uses the shared parallel-transport frame cache.
- [x] Arterial-to-venous colors are generated as vertex-color gradients.
- [x] The first-level route has no entities or physical obstacles.
- [x] A shared browser test drives PlayerRBC from 0 to 3000 at BP 100 in 300
  simulated seconds and reaches the explicit endpoint.
- [x] Foreground Chrome driving visibly advances distance and SVG progress and
  changes Location from left ventricle to aorta and descending aorta.

## Browser And Performance

- [x] Node shared suite: 60 passed, 0 failed.
- [x] Browser shared suite: 60 passed, 0 failed.
- [x] 1280 x 720 has no horizontal or vertical game-page overflow.
- [x] 1920 x 1080 has no horizontal or vertical game-page overflow.
- [x] 1920 x 1080 PLAYING runs at 59 to 60 FPS after the render-scale fix.
- [x] Final local game and test pages produce no console errors or warnings.
- [x] GitHub Pages workflow passes and the live subpath serves Phase 02 assets.

The PASS conclusion and all evidence are recorded in
`reports/phase-02-report.md`.
