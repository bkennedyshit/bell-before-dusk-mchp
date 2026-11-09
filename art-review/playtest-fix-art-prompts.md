# Playtest correction artwork — 2026-10-19

Generated using the built-in image-generation tool, not the CLI. Original outputs remain in the Codex generated-images directory. Production copies:

- `assets/hero/courier-run-v3.png`: 4 columns × 4 rows. Reference: `assets/hero/samurai-courier-sprites-v2.png`. Match yellow haori, teal trousers, white headband, black topknot and sheathed katana. Rows front, west, east, rear; columns left-leg lead, passing pose, right-leg lead, passing pose. Transparent, full body, equal cells, consistent scale and baseline, black outlines, no dust/shadows/text/matte.
- `assets/characters/road-demons-eight-directions-v1.png`: 8 columns × 4 rows. Columns S, SW, W, NW, N, NE, E, SE. Rows red armored oni alternating footfalls, then green horned beast alternating footfalls. Detailed dark-fantasy pixel art, black outlines, true rear views, transparent, no labels/matte/scenery. Used for top-down raiders/prowlers; existing boss, wisp and side-view bandit art retained.
- `assets/characters/ferry-citizens-v2.png`: 8 columns × 2 rows. Rust-coated fisherman with cream headwrap, and plum-kimono woman with sage obi. Each row: front two steps, rear two steps, left two steps, right two steps. Transparent, grounded, black-outlined detailed chibi Edo pixel art; no shadows or grid. Used for Nao and Mika, not wholesale replacement of old townspeople.
- `assets/journal-frame-v1.png`: rectangular 3:2 dark indigo/charcoal journal panel with a thin consistent antique-bronze frame and restrained wooden corners. Front view, empty textured center, no lettering or controls. Runtime nine-slices corners/edges and draws live text on top.

Generated sprite cells are alpha-measured once at load to register their feet. Generated art is not assumed to provide collision geometry: authored floor/solid rectangles and landing surfaces remain authoritative.
