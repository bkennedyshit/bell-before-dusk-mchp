# Cinder Maw production atlas

Front-facing neutral pose: assets/characters/cinder-maw-front-idle-v1.png.
Exact right-facing sibling: assets/characters/cinder-maw-boss-atlas-right-v1.png.
The user explicitly requested mirroring; tools/mirror-boss-atlas.cjs performs a
deterministic full-sheet flip and checks all RGBA pixels against the original.

## Front-pose prompt

Use case: stylized-concept. Asset type: single production transparent pixel-art boss sprite. Reference image is the Cinder Maw animation atlas; preserve EXACT character identity, proportions, materials, colors and pixel-art finish. Generate ONE neutral FRONT-FACING full-body standing pose of that same charcoal gray oni, looking straight at viewer, neither left nor right. Two crooked ivory horns, spiky black mane, glowing amber eyes and mouth, cracked ember charcoal skin, rust-red samurai shoulder plates, rope waist sash, claw hands relaxed at sides, bare claw feet planted at same level. Symmetrical frontal stance with weight settled, no action, no weapon, no flames/effects, no shadow or ground. Character fully visible centered with generous transparent padding around horns and feet. Same detailed dark Edo game sprite shading and chunky dark contour as the supplied atlas. Not a portrait or illustration: ready to render alongside the atlas at identical body scale. Actual transparent background, no text, no white matte/fringe, no extra figures.

Built-in image_gen, transparent PNG. Style reference: existing original road demon
atlas. Output copied to assets/characters/cinder-maw-boss-atlas-v1.png. Twelve equal
poses arranged four columns/three rows. Generated gutters vary, so runtime uses
explicit source rectangles and alpha-derived foot baselines, with one fixed
scale; it never rescales each pose by its alpha bounds. Original is retained.

## Exact prompt

Use case: stylized-concept. Asset type: production transparent pixel-art boss animation sprite atlas for the Japanese samurai game Bell Before Dusk. Image 1 is STYLE REFERENCE ONLY, not an edit target: match its textured low-resolution sprite shading, dark outlines and muted Edo palette. Create an ORIGINAL demon called the Cinder Maw: hulking charcoal-gray oni with two crooked ivory horns, rust-red shoulder armor, rope waist sash, glowing amber mouth and eyes, enormous clawed arms, bare claw feet. Distinct from all existing characters. SIDE VIEW, faces LEFT consistently, no top-down perspective. Exactly TWELVE poses in a perfectly regular FOUR COLUMN by THREE ROW grid, equal cells, generous transparent padding; no visible grid or text. Every cell shows the SAME creature at the SAME scale and centered body registration, feet on the same baseline when grounded. Read left-to-right, top-to-bottom: 1 neutral idle; 2 breathing idle; 3 both arms drawn high winding up slam; 4 heavy two-fist slam crouch; 5 upright inhale with mouth glowing; 6 horizontal breath attack mouth open to left; 7 claws raised casting with amber runes; 8 diving downward claws forward; 9 tired recovery hunched; 10 recovery lifting head; 11 hurt recoil; 12 defeated kneeling crumbling into a few dark embers. Keep full horns/claws visible inside every cell. No floor, background, cast shadow, scenery, glow cloud, labels, white fringe, border, watermarks or extra figures. Actual transparent background. Each pose crisp detailed game pixel art, not smooth vector or photorealistic illustration.
