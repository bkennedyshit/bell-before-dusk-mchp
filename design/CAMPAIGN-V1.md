# Bell Before Dusk — Campaign alpha

## 0.3.0 final-design playtest update

The journey below remains connected in the same order. The storehouse now appends
a dedicated captain room with six reachable shelves, a room checkpoint and three
warned attacks. JOURNAL → JOURNEY KIT adds three earned weapon profiles, two
optional favors, discovered-town travel after Willow, and saved Normal/Assist.
Authored intro, progression dialogue, guardian epilogue and credits are integrated.
Existing schema1 saves retain progress. See `STORY-FINAL.md` and `HUMAN-PLAYTEST.md`.

The debug APK is fully unlocked. A separate unsigned release AAB enables the free
opening / full-game gate and native purchase-restoration bridge; the public key,
Play product, real purchase tests, permanent identity and signing remain release
gates, not completed account work. See `BILLING-SETUP.md` and `RELEASE-CHECKLIST.md`.

Implemented 2026-10-19. This expands the existing bell-defense prologue into a
connected campaign. It is a local HTML game alpha, not a Google Play release.

## Journey

Finish the original clapper chase and bell defense, then choose Continue the
Journey. Post Town keeps its bell, inn, forge, residents and four-way movement.
For a direct review of the new content, open /?chapter=roads. This starts after
the bell defense with a blade upgrade and six mon, and uses a separate preview
save slot. The main journey save is not changed.

| Place | Connection / requirement |
| --- | --- |
| Post Town north | Cedar Road |
| Cedar Road shrine trails | Original Forest Spirit Path replay OR Cedar Canopy; recover Canopy's upper-deck road token |
| Cedar Road north | Cedar Hamlet, unlocked by clearing Cedar Canopy |
| Post Town south | Southern High Road, the two-panel rice-field map |
| High Road east | Flooded Causeway platform stage |
| High Road south | Willow Ferry |
| Willow Ferry south | River March, another exploration field |
| River March west | Harvest Levee platform stage, unlocked by Causeway clear; returns to River March |
| River March east / coast | Explicitly closed chapter boundaries; no additional town is claimed |
| Harvest Levee | Recover the upper-deck warehouse key |
| High Road west | Bandit Storehouse platform stage, unlocked by Harvest clear |
| Storehouse | Defeat captain and recover the ward seal |
| Cedar Hamlet north | Broken Ward guardian arena, unlocked by captain defeat |
| Guardian defeated | Campaign victory; towns react and routes remain replayable |

Five playable platform levels total: the original Forest Spirit Path and the
four integrated routes above. Unused environment concepts remain available
for future levels; they are not counted as playable content.

## Town characters

Residents give directions from each town's streets. Gen, Takeshi, Mika and Riku
serve indoors: the additional towns reuse Post Town's visible inn/forge facades,
actual door interactions, interior images and host sprites. Nao and Mina use
fisherman/kimono variants. Purchases require explicit confirmation and
conversations remain open until acknowledged. The original Post Town services
and characters remain unchanged.

| Town | Character | Function |
| --- | --- | --- |
| Cedar Hamlet | Aya, warden | Explains seal theft and the guardian gate |
| Cedar Hamlet | Gen, innkeeper | Free health restoration |
| Cedar Hamlet | Takeshi, smith | One permanent +1 damage upgrade, 6 mon |
| Willow Ferry | Nao, ferrymaster | Causeway / ferry / warehouse quest dialogue |
| Willow Ferry | Mika, innkeeper | Free health restoration |
| Willow Ferry | Riku, merchant | One permanent +20 maximum-health upgrade, 4 mon |

Residents patrol short four-direction routes, pause when approached, and have
foot-level separation from the player and each other. Travel and rest advance
a day/dusk phase counter; this is not an offline real-time timer or a full
day-by-day schedule simulation.

## Platform mechanics

Each stage has landing surfaces, enemy patrols, a return destination and checkpoint.
New stages render each whole panel in one transform; native contact bands and
alpha-measured spans drive collision in that same transform. No independently
raised/cut strips remain. The original Spirit Path reuses its original terrain
segments. Background tiles cover the full view and a vertical camera follows
upper-deck jumps. Tap gives a short hop; holding JUMP gives a higher jump. Decks
allow upward passage, landing from above and down + JUMP drop-through. EXIT/RETURN
are touch buttons on the lower route; keyboard shortcuts remain optional and
upper floors never auto-transition at the right edge.

Top-down routes use authored walkable rectangles plus solid scenery/threshold
rectangles. Gate, shrine and boat solids block bodies, while nearby contextual
interactions handle travel. Road plaques fade when the hero approaches them.
Campaign roads include bandits and eight-direction prowler/raider sprites.

Ground markers save progress. Death returns to the checkpoint with full
health and a one-mon penalty; road deaths return to a safe entry. Journal
provides a retreat option so a stage cannot trap the player.

## Bosses

The side-view captain alternates a warned rushing slash and thrown projectiles.
Guarding prevents damage; recovery exposes the boss. The player can jump over
the rush and use upper decks to reposition.

The top-down guardian alternates a warned charge toward a locked target
position, marked ground strikes, and a radial projectile burst. Damage only
lands during recovery. Half health shortens the warning but keeps it visible.
Both bosses reuse existing enemy artwork in this alpha.

## Saving and controls

Save schema 1 uses localStorage on the current browser origin. Gates, services,
checkpoints, tokens and boss results save immediately; active play also saves
every eight seconds. Storage failure shows SAVE UNAVAILABLE without crashing.
Platform saves resume at the checkpoint with collected tokens preserved.

Title: Continue Journey, or tap New Journey twice to replace an existing save.
Journal: Resume, Retreat / Return to Safety, Save and Title. Escape also pauses.
Movement: WASD/arrows or joystick. Top-down slash: J/Space or red seal.
Platform jump: Space/W/Up/red; slash: J/teal; drop through: down + jump. E interacts.
As of 0.2.2: tap terrain to walk horizontally, tap Yusuke to slash, double-tap
terrain for a short hop or triple-tap for a high jump. Double taps wait 260ms
for a possible third tap; joystick + JUMP remain an immediate alternative.
Manual input, pause and transitions cancel touch destinations. Top-down tapping
Yusuke slashes, but top-down multi-taps never jump.

## Verification and limits

Run node tests/campaign.cjs and node tests/campaign-browser.cjs. Existing input,
enemy-boundary, sprite-facing, shadow-registration and town-crowd suites remain
applicable. Browser checks load every expansion scene and asset and verify real
reload restoration, portrait fit and touch journal behavior.

Automated coverage is not a substitute for a full fresh-player campaign
playthrough on phones. Balance, timing, dialogue and scene transitions still
need human playtesting. The separate Android wrapper now has verified emulator
lifecycle, offline loading and save/restart tests. An AAB, Play Billing, store
listing, closed testing and release review remain outstanding. See
`HUMAN-PLAYTEST.md` for the human test route; no completed human run is claimed.
