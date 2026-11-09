# Japan map and cloth controls — 0.2.3

Generated with the built-in image-generation tool. Final project-bound assets:

- `assets/ui/japan-journey-map-v1.png`: opaque archipelago background, 1024x1536.
- `assets/ui/edo-cloth-controls-v2.png`: six transparent grid components, 1536x1024.

Existing UI assets and the original generator outputs were preserved. Route
markers/labels are drawn dynamically, not baked into the art. The settlements
are fictional, so this is an illustrated game route, not a historical travel map.

## Map prompt

Use case: stylized-concept. Production background for a Japanese samurai adventure game's world-map screen. Portrait 1024 by 1536. A clearly recognizable illustrated map of JAPAN, the complete Japanese archipelago with Hokkaido upper right, long curved Honshu running from upper right through center to lower left, Shikoku below western Honshu, Kyushu at lower left, tiny Ryukyu islands. Correct recognizable island shapes and relative placement, not a random fantasy continent. Flat antique Japanese woodblock/hand-ink cartography, very fine ink coastlines, muted moss and straw land, subdued blue-green sea, buff tea-stained paper ground; medium light values, never white or black. Discrete mountain ridges, tiny groves and rice-field marks, enough quiet open area on central Honshu and surrounding sea for interactive pins and labels to be overlaid in code. Honshu is large and dominant in the center. No writing, labels, cities, pins, roads, route lines, compass letters, borders, scroll ends, gold decorations, pirate elements, heraldry, watermark or text. Straight-on opaque map image fills the canvas edge to edge. This is an illustrative Japan geography background, not a flowchart.

## Controls prompt

Use case: stylized-concept. Production touch-control atlas for a hand-painted pixel-art Japanese samurai adventure game, not a mockup. Exactly SIX separate components in a perfectly regular THREE COLUMN by TWO ROW grid, each same-sized square cell, components centered in their cells with at least 12% transparent padding. Canvas landscape 1536x1024. Transparent background everywhere outside the components. Read order: top left a simple flat circular joystick base made of woven muted sage cloth with a slim dark ink edge; its center is an empty recessed pale olive disk. Top middle a SMALL joystick thumb knob, a rounded cushion of warm tan cloth, diameter 40% of the other buttons; thin dark edge, minimal shading. Top right a full round vermilion cloth/lacquer action seal bearing a single pale katana blade symbol diagonally upward. Bottom left a full round muted olive cloth action seal bearing a single pale upward chevron for JUMP. Bottom middle a full round muted indigo-teal cloth action seal with a simple pale speech-scroll symbol for interaction. Bottom right a full round pale wood/olive action seal with a small dark Japanese torii doorway symbol. Cohesive crisp hand-painted pixel edges, clean silhouettes visible at 64 screen pixels. Practical understated Edo-Japan materials. Thin dark edges only; NO GOLD, no brass, no chains, no nautical motifs, no compass rose, no chunky carved rims, no western fantasy, no pirate styling, no spikes, no gems. Flat frontal lighting, not glossy or 3D chrome. Do not include words, letters, lettering, watermarks, framing, shadows outside the components or any additional objects. All six clearly separate and fully inside their own exact grid cell.

## Checks and limits

- Source alpha inspected: control corners are genuinely transparent; alpha ranges 0..254.
- Source measured boot contacts are metadata, not a raster edit. Running and idle
  shoe patches are rendered behind sprites with a reduced-opacity body shadow.
- World plaques are below the final touch-control layer. Modals cover controls
  intentionally while paused.
- Live browser build marker verified as 0.2.3-local; continued existing save and
  saved `art-review/campaign-playtest/live-japan-map.png` as visible proof.
- New native revision is packaged but not device-tested: emulator disconnected.
