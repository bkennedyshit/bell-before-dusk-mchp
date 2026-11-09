# Cinder Maw — 0.3.1 encounter

Original demon, separate from the human Bandit Captain. The captain's defeat
summons it into the six-shelf storehouse arena. It binds the seal until defeated;
Aya's north gate, map lock and directions agree. Captain progress saves separately:
dying to the demon restarts the demon at the arena checkpoint, not the captain.
Existing completed guardian saves retain their completed ending.

## Research and decisions

Nintendo's developer guidance for Metroid Dread recommends watching boss movement
to learn incoming attacks and observing feedback when attacks do no damage:
https://metroid.nintendo.com/dread/news/metroid-dread-report-vol-11/
Their newcomer report also describes connecting movement and combat actions:
https://metroid.nintendo.com/dread/news/metroid-dread-report-vol-9/

Applied here: a predictable warning/attack/recovery cycle, visible danger heights,
safe platforms reachable with the existing jump, a guarded-hit explanation, and
vulnerable recovery. These are general design principles; neither characters,
artwork nor a particular boss sequence are copied. Twelve poses is our production
choice, not an externally prescribed minimum. Do not add arbitrary animations
that do not communicate a different combat state.

## Moves

1. FLOOR FIRE: both arms lift; the whole floor glows. Warning 1.5 seconds
   (1.2 below half health), then sustained fire 1.6–1.9 seconds. A ground jump
   alone ends too soon. Land on a side ledge. The hazard is absent on upper tiers.
2. FIRE BREATH: marks the player's current support height, then sweeps that row
   for 1.15 seconds. Jump up or drop to a different tier. Only the marked height
   is dangerous; safe rows stay clear.
3. MARKED DIVE: marks an actual landing surface, gives the same warning, then
   arcs to it over .85 seconds. Leave the mark. Its body is vulnerable for
   3.6 seconds after landing; other recoveries last 3.3 seconds.

42 health; floor/breath 14 damage, dive 18. Normal and Assist use the existing
damage/warning modifiers. No collision surface disappears, no movement speed or
jump height changes, and no second attack overlaps a warning. Old captain knives
are cleared when the demon emerges. Death animation lasts 1.2 seconds; the exit
stays blocked during summoning and combat. Contact alone does not deal hidden
damage. Attack regions are drawn in the same world coordinates as their hit tests.

## Art

Original generated charcoal/ember oni, amber face, crooked ivory horns and rope
sash. Transparent atlas: assets/characters/cinder-maw-boss-atlas-v1.png.
12 left-facing poses: idle x2, slam anticipation, slam, inhale, breath, casting, dive,
recovery x2, hurt, defeat. Rendering uses explicit source rectangles, a fixed
scale and alpha-derived foot baselines; no per-frame silhouette resizing.
Separate right-facing file: `cinder-maw-boss-atlas-right-v1.png`, exact mirrored
RGBA verified pixel by pixel. Coordinates/anchors reverse with the atlas so the
body does not shift. Front idle/entrance: `cinder-maw-front-idle-v1.png`, a separate
generated neutral full-body pose, neither left nor right. Actions turn toward
Yusuke; idle returns to front. All three assets ship offline in Android.
Exact prompt/provenance: art-review/cinder-maw-2026-10-29.md.

## Verification

tests/demon-boss.cjs covers nine meaningful behaviors: save/checkpoint/gate,
no approach teleport, floor danger versus safe ledge, jump duration and real
ledge reachability, marked-row evasion, real-surface dive/recovery, guarded hits
and saved victory, every attack's rendering path, and death/retry at the safe
marker without repeating the captain. Browser checks render real art and sample the arena backing
before the vignette to ensure the outdoor background cannot leak underneath.
Native fight evidence and artifact hashes are recorded in TEST-REPORT-0.3.1.md.
No Vercel deployment is part of this work.
