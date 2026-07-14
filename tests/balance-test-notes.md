# Phase 01 Balance Notes

Phase 01 verifies only the driving prototype values. It does not tune formal
level duration, entity density, collisions, QTE pacing, or status effects.

## Verified BP Speed Map

| BP | Speed |
| --- | --- |
| 50 | 5 u/s |
| 80 | 8 u/s |
| 100 | 10 u/s |
| 130 | 13 u/s |
| 150 | 15 u/s |
| 180 | 18 u/s |

- BP changes at 18 points per second while Z or X is held.
- Holding Z and X together produces a zero BP adjustment axis.
- BP clamps to 50 through 180.
- Local cross-section movement is 4.5 world units per second.
- Diagonal arrow input is normalized to avoid a diagonal speed bonus.
- The player-center boundary is `section radius - 0.65 - 0.35`.
- The prototype track is 720 logical world units and is not formal level data.

All values above are read from `js/config.js`; tests do not introduce a second
gameplay source of truth.
