# Road revision generated assets — 2026-10-19

Built-in image generation was used for these two additions. Existing source
atlases were preserved; production copies are in the repository. No CLI fallback.

## assets/hero/courier-diagonal-run-v1.png

Reference: assets/hero/courier-run-v3.png, used only for identity/style.

Prompt: Additional diagonal RUN frames for the exact yellow-jacket, teal-trouser,
black-topknot, white-headband hero with sheathed katana. Four columns × four rows:
southwest, southeast, northwest, northeast; four alternating lead/passing footfalls
per direction. Rear diagonals show the back of the head. Full bodies, consistent
scale/baseline, generous transparent margins, detailed black-outlined pixel art.
Genuine alpha; no labels, grid, matte, scenery, dust or shadows.

## assets/characters/red-bandit-eight-directions-v1.png

Reference: assets/characters/edo-citizens-v1.png, bottom-left red thief only.

Prompt: Preserve the red-clad thief's dark gray tied headscarf, rust-red kimono
and trousers, wrist wraps, sandals, belt sword and wooden clapper. Eight columns
S, SW, W, NW, N, NE, E, SE; four rows left lead, passing, right lead, passing.
Visible alternating legs/arms, true rear views, consistent scale and baseline,
full bodies separated by transparent margins. Detailed Edo pixel art with black
outlines; no checkerboard/white matte, text, scenery, floating props or shadows.

Both atlases are read as principal connected silhouettes at runtime rather than
assuming generated grid edges are exact. A 64-pose browser audit checks hero
cardinal/diagonal and bandit foot contact. Facades, interiors, ghost art, original
Spirit Path and River March's temporary rice-road background reuse existing art;
they were not represented as newly generated artwork.
