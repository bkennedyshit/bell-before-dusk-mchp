# Platform linework review

## Corrected export, 2026-09-05

The production asset is now `../assets/environment/spirit-path-terrain-v7-black-stroke.png`: a 2172 × 724 RGBA PNG exported by the deterministic Canvas routine in `terrain-outline.js`. It preserves transparency, cleans neutral pale matte pixels, and adds a three-pixel black edge stroke. Open `terrain-outline-review.html` through a local server for before/after comparison and PNG export. The three sampled bridge openings have alpha 0 and no pixels matching the white-matte threshold remain.

## Earlier generated previews — rejected

Generated with the built-in image editor on 2026-09-04.

- `spirit-path-terrain-v7-outline-preview.png`: stronger black contour and structural linework, retained for visual review only.
- `platform-outline-prompt.txt`: exact first-pass prompt.
- Original production sheet: `../assets/environment/spirit-path-terrain-v6-clean.png`.

Do not use the preview as a drop-in game asset. Inspection found an RGB export with a baked checkerboard, not RGBA transparency. A second background-extraction attempt also returned RGB and changed width from 2172 to 2173 pixels. Neither generated variant was wired into the game or deployed. The original production PNG remains unchanged and has real transparency.
