# Build Log

## 2026-09-05 — Stuck movement and haunted-field gate boundary

- Reproduced stale tap/held input carrying across Spirit Path transitions: the previous code could move the returned hero from Y 208 to approximately Y 79. Scene transitions now clear travel targets, held keys, and touch-button state.
- Added lost-pointer-capture, window blur, page backgrounding, and pointer-cancel cleanup. A second touch cannot take ownership of the joystick, and touching its center immediately cancels tap travel.
- HUD, notices, and inactive context controls no longer create destinations behind their overlays. Notice taps dismiss the notice; destinations in solid scenery are rejected.
- Closed the north field wall and gate corridors at Y 185, keeping Yusuke's collision circle in front of the painted torii/stone gate. Retained reachable CHASE/PATH/SEALED and south return interactions, and moved the northern resource node onto the reachable path.
- Walk animation now stops when collision prevents movement, even if a direction remains held.
- All 12 input/boundary regression checks passed; the pre-fix version failed 11. Visually verified an isolated real-game scene after holding UP for five seconds: Yusuke remained on the approach path below the gate. Production contains no test shortcut.

## 2026-09-05 — Human enemy and demon matte cleanup

- Exported real RGBA sheets for the three platform enemies, the human bandit walking sheet, and all four demon types. Removed the outer checkerboard plus reviewed enclosed pockets between arms, weapons, and spectral loops.
- Darkened neutral pale edge fringes while protecting human facial highlights and retaining demon masks, teeth, blades, and colored attack effects. Corrected the raider attack pose's gray pocket under its arm explicitly.
- Preserved original atlas dimensions and frame positions. The game now loads the clean PNGs directly instead of attempting background removal at runtime for these three sheets.
- Reviewed all poses over the forest and cycled the exported frames at game sprite sizes. Sampled guard and raider arm gaps were alpha 0, while the guard eye and wisp mask remained alpha 255. Syntax and whitespace checks passed.

## 2026-09-05 — Transparent platform outlines

- Replaced the platform terrain sheet with a deterministic Canvas export of the original artwork: a three-pixel black stroke following outer edges and bridge openings, with near-white matte pixels removed and pale edge fringes darkened.
- Preserved the 2172 × 724 atlas, platform geometry, cell locations, and collision/contact offsets. Exported an RGBA PNG and verified zero remaining pixels matching the white-matte threshold and alpha 0 inside all three sampled bridge openings.
- Reviewed the original and outlined artwork against the forest background. The game loads the finished local PNG directly, with no runtime outline processing or network dependency added.
- Retained the outline routine and before/after preview in art-review for repeatable adjustment and PNG export.

## 2026-09-03 — Forge keeper counter occlusion

- Corrected the smith's foreground mask to begin at the actual countertop lip rather than partway down the bench.
- Raised her authored standing position behind the bench so her head and shoulders remain visible while her lower body is fully occluded by the workbench.
- Verified the unobstructed forge view at an iPhone-sized viewport; she now reads as standing behind the counter instead of composited onto it.

## 2026-09-03 — Touch cardinal-path correction

- Follow-up screenshots showed that optical sprite registration alone did not eliminate the visible track change during touch reversals: small horizontal thumb error was still accumulating as real world-X movement.
- Added proportional cardinal snapping to the analog stick. Near-vertical gestures now output exactly zero horizontal velocity and near-horizontal gestures output exactly zero vertical velocity, while intentional diagonals remain available.
- Retained the measured front/rear sprite registration fix so both the actor's world position and rendered body center share the same track.

## 2026-09-03 — Interior keeper role correction

- Kept the Sparrow Forge smith behind her true freestanding workbench, with the authored counter foreground hiding her lower body.
- Moved the Crooked Carp innkeeper onto the open tatami because that room's bar reads as a wall fixture rather than a staffed freestanding counter.
- Added a grounded shadow and a normal actor collision for the floor-standing innkeeper, and tightened REST to a real conversational distance while retaining a reachable interaction radius for the smith across her workbench.
- Phone-viewport verification confirmed the innkeeper is approachable on the tatami with REST available at conversational range, while the smith remains visible and correctly occluded behind the forge bench; the temporary direct-room QA route was removed afterward.

## 2026-09-03 — Devpost thumbnail key art

- Generated original 3:2 landscape contest key art using the production town, Yusuke, and yokai sheets as identity and palette references.
- Kept all lettering out of the generated pixels, then added the exact `BELL BEFORE DUSK` title and `CHASE • GATHER • REPAIR • DEFEND` loop line during deterministic raster export.
- Exported the final Devpost PNG at 1536×1024 and 0.78 MB, safely below the five-megabyte upload limit, in the submission-artifacts folder rather than the playable game bundle.

## 2026-09-03 — Vertical hero registration and town prop bounds

- Measured the opaque bounds of Yusuke's vertical sprite cells and found the front pose baked roughly 30 source pixels right of center while the rear pose sat roughly 39 pixels left. Added per-direction optical registration so pressing only up/down keeps his rendered center on one world-X path.
- Expanded the safe-town bell collider from the bell body to the complete fenced garden, preventing entry through the painted rails. The smaller bell-body collider remains during the final breach so the yard can still be entered and the bell rung.
- Nudged the forge plaque three world pixels left to align it with the painted doorway.
- Phone-viewport verification compared consecutive pure-down and pure-up movement captures, confirming Yusuke remains on the same screen-X line; a direct approach to the bell garden stopped cleanly on the dirt below the fence.

## 2026-09-02 — Yokai locomotion animation correction

- Replaced the yokai's state-only pose selection, which left every moving beast locked on one locomotion image, with distance-driven frame switching between its planted and stride artwork.
- Stored each enemy's real horizontal travel direction so the sprite turns with its own movement instead of continually looking toward Yusuke while sliding another way.
- Removed the synthetic whole-body sine bounce; movement now reads through authored limb/body pose changes on a fixed ground baseline, with the dedicated third atlas row still reserved for attack telegraphs.

## 2026-09-02 — North-facing citizen shadow cleanup

- Traced the chief's split-shadow turn to a detached 221-pixel component baked into the bottom margin of his north-facing atlas cell, rather than the game's shared ground-shadow ellipse.
- Cleared the unused bottom strip of the north-facing citizen row after runtime matte removal. This removes the chief's dot and equivalent generated floor remnants from other north-facing townspeople without touching their feet or the consistent code-drawn shadow.

## 2026-09-02 — Title call-to-action restoration

- Replaced the stretched crop from the full HUD skin on the title screen with a dedicated transparent pixel-art button frame.
- Kept `TAP TO BEGIN` and the loop summary as live canvas text so the submission remains readable and the generated asset contains no baked lettering.
- Removed the unrelated blue-black sheet background around the title control; only the compact charcoal, brass, and oxblood plaque now overlays the dusk artwork.
- Added a restrained shadow and stronger ivory text contrast for phone readability without obscuring the title illustration.

## 2026-08-24 — Town / outskirts route correction and hero study

### Prompt / design correction

- Re-examined the supplied *Legend of the Mystical Ninja* SNES screenshots and researched the original game's alternating elevated town and side-view action-stage structure.
- Re-read the competition design guidance before changing scope. The fixed portrait requirement and Survival & Resource Management floor remain controlling constraints.
- Identified the current gray box's core clarity failure: the side-view scene, mist, shrine processions, and resource conversion occur without a readable physical or narrative cause.

### Decisions

- Reframed the prototype as one 6–8 minute town incident: safe town introduction, explicit roof-bandit chase, two cursed-outskirts gathering runs, in-world bell repairs, and a final gate breach.
- Reserved human enemies for the town/roof incident and yokai for the outskirts/final breach.
- Replaced arbitrary mist transitions with a physical town gate and an outskirts-only fog pressure meter.
- Kept the roof platform section under one minute so the judged core remains gather, convert, and survive.
- Recorded the full replacement route and asset ceiling in `design/TOWN-OUTSKIRTS-REVISION.md`.

### Asset pass

- Generated an original samurai courier animation study using the supplied images only as references for readability, animation economy, and camera grammar.
- Established an original mustard, teal, cream, charcoal, and brass palette; short haori, hakama, headband, ward bell, message box, and katana silhouette.
- Rejected direct integration because the generated sheet contains a baked checkerboard rather than true alpha. It remains a character-direction reference at `assets/hero/samurai-courier-animation-study-v1.png`.
- A second background-removal generation was rejected because it painted a dark background instead of producing alpha.

### Next implementation pass

- Replace the current gray-box route before producing more final art: town objective, physical roof transition, gate threshold, outside fog pressure, bell-yard conversion, and final bell defense.
- Generate production sprite frames in smaller pose batches after the hero design is approved.

### Route-v2 implementation

- Replaced the previous `Mistbound Shrine` build with the `Bell Before Dusk` route-v2 gray box.
- Added an explicit safe-town objective, human bell thief, marked ladder transition, short side-view roof chase, and recovered-clapper payoff.
- Added two outside gathering runs with cedar nodes, yokai-ash combat rewards, an outside-only fog pressure meter, safe return through the visible town gate, and escalating enemy behavior.
- Replaced the abstract shrine procession flow with two bell-yard conversion choices and a final breach that requires both sword defense and ringing the repaired bell.
- Added persistent objective text, safe/danger zone labeling, run-specific resource requirements, bell integrity, ward resonance, victory, defeat, score, and immediate restart.
- Kept the fixed portrait canvas and entirely offline single-file implementation.

### Verification

- Parsed the complete embedded JavaScript successfully with Node.
- Loaded and visually inspected the new title, town, human incident, ladder cue, and rooftop transition through the local browser build with no console errors.
- Ran an instrumented full-route state test covering town start, bandit escape, ladder transition, first run, first repair, second run, second repair, final breach, charged-bell victory, destroyed-bell defeat, and reset. All route assertions passed.

## 2026-08-24 — First production visual integration

### Correction

- The route-v2 handoff still displayed the code-drawn hero and town placeholders even though a stronger hero concept had already been generated. That made the playable build materially misrepresent the intended visual direction.

### Character assets

- Converted the approved samurai courier study into a 1264×1244 sprite sheet with genuine transparent alpha.
- Integrated directional top-down idle, walk, and katana frames plus dedicated side-view idle, run, jump, and slash frames.
- Added the hero to the title screen at a legible phone scale.
- Generated and integrated matching transparent sprites for the pompous town official and bell thief, including talking and rooftop-running poses.

### Environment asset

- Generated and integrated an original 1024×1536 safe-town backdrop grounded in Japan circa 1605.
- The town now uses layered distant roofs, a fortified upper gate, side-building facades, a clear central street, a reachable right-side ladder, a centered bell yard, and a close foreground roof at the bottom.
- The backdrop remains original and uses the supplied legacy screenshots only for general architectural framing and readability principles.

### Files

- `assets/hero/samurai-courier-sprites-v2.png`
- `assets/characters/town-npcs-v2.png`
- `assets/environment/post-town-v1.png`

## 2026-08-21 — Project initialization

### Decisions locked

- The competition rules and official design guidance are the design authority.
- The prototype will be designed as a fixed-portrait, touch-first, single-session game.
- No theme, story, camera style, or genre is locked before comparing core-loop candidates.
- The first implementation will be a gray-box prototype focused on the repeated player action.

### Work completed

- Created the project workspace and contest-compatible top-level folder structure.
- Recorded the official constraints and a mechanic-first build sequence.

### AI involvement

- Codex reviewed the official competition rules, FAQ, and Design Guidance.
- Codex created the initial project structure and documentation from the user-approved direction.

### Next session

- Generate mechanically distinct candidates across the three eligible genres.
- Score them against engagement, playability, core-loop design, focus, originality, and implementation risk.

## 2026-08-21 — Category and format selected

### Decisions locked

- Selected category: Survival & Resource Management.
- Selected format: a compact, touch-first micro-adventure.
- The required core loop is venture out, gather/fight, return, convert resources into upgrades, and survive escalating pressure.
- Target session length is 6–10 minutes with three escalation cycles and an immediate restart.
- The adventure layer will support the required genre systems rather than functioning as a conventional long-form action RPG.

### Scope constraints

- One shelter interior and one outdoor field.
- One hero, two normal enemy behaviors, and one final threat.
- Two gathered resources and four to six meaningful upgrades.
- No open world, large crafting tree, quest system, persistent save, or separate turn-based battle mode in the first complete build.

### AI involvement

- Codex translated the official genre floor, mobile guidance, judging rubric, and packaging requirements into the initial game specification.

### Next session

- Resolve the remaining mechanic variables: exact resources, survival pressure, control scheme, upgrade pairs, and final threat.
- Create a gray-box portrait prototype only after those variables produce a complete loop on paper.

## 2026-08-21 — Theme and prototype presentation selected

### Decisions locked

- The world will be an original Japanese-folklore-inspired setting.
- The contest prototype will use a 2D top-down, tile-based presentation informed by the visual economy of 16-bit action-adventure games.
- No 3D modeling, character rigging, or free-camera work is required for the prototype.
- A richer 3D interpretation is reserved for a possible completion rebuild; the submitted prototype is optimized for speed, clarity, touch play, and the competition rubric.
- Existing games are references for broad pacing and presentation principles only. All characters, environments, interface, terminology, animation, audio, and gameplay expression will be original.

### AI involvement

- Codex inspected the supplied visual reference and revised the prior low-poly 3D recommendation into a smaller 2D production plan.

### Next session

- Define the exact player action, resource pair, enemy roles, upgrade choices, and escalation timings before producing final sprites.

## 2026-08-24 — First playable implementation started

### Decisions locked

- The original setting is Meiji-era-inspired Japan with ordinary safe areas contrasted against mist-heavy supernatural combat areas.
- The hero's primary weapon is a katana recovered from the shrine altar.
- The core prototype remains a top-down Survival & Resource Management game.
- One short side-view spirit-road traversal is included as an authored transition, not as a separate progression system.
- Initial implementation uses code-drawn placeholder art with no external dependencies or network requests.

### Work completed

- Created a standalone portrait `index.html` gray-box prototype.
- Implemented touch and keyboard movement, contextual gathering/katana action, two resources, hero and shrine health, timed processions, two enemy roles, resource conversion through upgrade choices, a short side-view traversal, a final threat, outcome states, scoring, and immediate restart.

### AI involvement

- Codex designed and implemented the initial complete game loop from the locked competition constraints and user-selected direction.

### Next session

- Run and playtest the entire session locally.
- Fix state-transition, input, balance, and presentation problems before creating final assets.

## 2026-08-24 — Browser playtest and first corrections

### Verification completed

- Loaded the game from a local HTTP server in a portrait browser viewport.
- Confirmed the title, start interaction, katana acquisition, top-down traversal, safe-to-mist visual transition, enemy spawning, contextual katana combat, hit feedback, and touch controls.
- Confirmed the page produces no browser console errors or warnings during the tested opening sequence.
- Confirmed `index.html` parses successfully, contains no external URL references, and remains far below the 35 MB package limit.

### Corrections made

- Added tap-to-move alongside the floating movement pad for more accessible one-thumb play.
- Added contextual action labels: OPEN, GATHER, SLASH, JUMP, and ACTION.
- Made combat automatically face nearby threats.
- Prevented gathering from overriding combat when an enemy is in striking range.
- Reduced roaming-enemy speed, damage, population, and attack frequency so the procession remains the primary escalation.
- Corrected spirit-road collectible and enemy heights relative to the side-view platforms.
- Increased contextual gathering range for phone-sized input.

### Next session

- User playtest of the complete session.
- Tune procession timing, resource costs, survival difficulty, and side-view traversal from observed play.
- Produce original visual assets only after the complete loop is approved.

## 2026-08-24 — Historical setting corrected

### Decision locked

- Replaced the Meiji-era direction with a fictional Japanese province in 1605, during the Keichō era and the transition from Momoyama warfare into early Tokugawa rule.
- The year is a material-culture anchor for architecture, clothing, roads, shrine objects, and the katana. The game does not depict a real historical figure or event.

### AI involvement

- Codex checked museum historical references and updated the prototype title and design documentation to reflect the corrected period.

## 2026-08-24 — Connected-world architecture pass

### Problem identified

- The first town implementation treated a portrait illustration as both scenery and geometry. It had no architectural collision, no horizontal world beyond the phone frame, an implicit Y-coordinate gate transition, and a stationary opening enemy.

### Work completed

- Replaced the single-screen assumption with a town map three phone-widths wide and a camera that follows the player horizontally.
- Added map-owned movement bounds and solid rectangular collision for buildings, foreground roofs, obstacles, the official, and the bell.
- Split town, inn, and hostile outskirts into separately loaded maps.
- Added explicit inn, north-gate, return-gate, ladder, resource, official, and bell interactions.
- Split the katana button from the contextual interaction button.
- Changed the bell thief from a stationary target into a patrolling/fleeing actor.
- Added wander, chase, telegraph, recover, and hit-reaction structure to yokai combat.
- Added an original orthographic Edo town panorama and removed the prior vanishing-point town image from gameplay.
- Documented the research-backed map and combat design in `design/WORLD-MAP-V2.md`.

### AI involvement

- Codex researched the N64 game's town/journey/door/gate structure, translated it into a smaller original 2D mobile design, implemented the map-engine pass, and generated the original town panorama with the built-in image-generation tool.

## 2026-08-24 — Contest loop defined

### Contest findings

- The selected lane remains Survival & Resource Management: gathering, conversion into useful repairs, and survival under escalating pressure are mandatory.
- Player Engagement, Playability, and Core Loop Design account for 75% of the weighted genre score; Focus accounts for another 15%.
- The contest guidance specifically favors one deep gather-upgrade-survive loop over a broad crafting tree or open world.

### Decisions locked

- The game is a 7–9 minute ward-bell survival run: town incident, supply run, repair, harder supply run, second repair, final breach.
- The central decision is whether to remain in the fog for more resources or return safely with enough to improve the bell.
- Cedar and spirit ash are the only carried resources.
- Four mutually exclusive bell/hero repairs create visible in-session builds.
- The separate side-view platforming stage is cut from the required contest route; the thief chase will use the same top-down movement and katana controls.
- The empty inn is cut unless it becomes a functional part of the repair loop.
- The contest scope does not include farming, turn-based combat, collectible monsters, additional towns, dialogue trees, or an equipment inventory.

### Corrections made

- Tightened Map 1 collision into one narrow walkable street band.
- Extended the upper solid boundary across the complete building line, including the gate; gate travel remains an explicit interaction.
- Raised the foreground-roof collision so the hero's feet can no longer enter the roof layer.
- Moved final-breach spawns onto valid street geometry.

## 2026-08-24 — Depth systems retained and integrated

### Prior decision superseded

- The prior proposal to cut the inn and all side-view platforming was too aggressive. Focus means every feature must reinforce the loop; it does not require a thin product.

### Decisions locked

- Keep one short Forest Spirit Path platform route as the dangerous connection between Gate Road and a richer shrine/graveyard overworld.
- Clearing the Spirit Path opens a permanent shortcut so it adds one authored escalation without becoming repetitive traversal.
- Platform enemies and caches award mon and rare resources, tying the route directly to survival progression.
- Keep one inn and make it functional: healing, one katana upgrade, one smoke charm, ward repairs, and a future save/resume location.
- Add mon as a tightly bounded optional currency. Cedar and spirit ash remain mandatory and cannot be purchased.
- Name the hero Yusuke/Yūsuke instead of the generic HERO label.

### Corrections made

- Reworked town collision to use a smaller foot radius and a wider walkable street band, preventing scenery overlap without trapping the hero between NPC and bell collision.
- Added a 1.14× top-down camera zoom and adjusted camera tracking and pointer-to-world conversion.
- Verified tap movement after the collision and camera changes.
- Replaced the generic HERO label with YUSUKE.
- Added a compact character/resource/status HUD, a rope-ring movement control, a brush-seal katana control, and a paper-charm context control as the first thematic interface pass.

## 2026-08-24 — Forest Spirit Path rebuilt

### Corrections made

- Replaced the rooftop debug-room presentation with a named Forest Spirit Path sequence tied to recovering the ward-bell clapper.
- Generated and integrated an original wide cedar-forest-to-haunted-shrine pixel-art background, with parallax camera movement.
- Replaced floating slabs with coded mossy ground, ravines, roots, rocks, a fallen-cedar bridge, stone-lantern checkpoints, and a shrine threshold.
- Split the side-view controls into dedicated JUMP and KATANA buttons; keyboard testing uses Space and J.
- Added patrolling platform enemies, checkpoint return behavior, and combat feedback.
- Verified JavaScript syntax and visually tested movement, jumping, katana feedback, terrain placement, and the portrait-phone composition in the local browser.

### AI involvement

- Codex created the original environment bitmap with the built-in image-generation tool, implemented the terrain and input pass, and tested the playable scene locally.

## 2026-08-25 — Contest loop depth and expedition identity

### Decisions locked

- Japanese architecture, folklore, and dry humor are the game's original thematic identity; the required Survival & Resource Management cycle remains the mechanical spine.
- Mon is optional risk currency dropped by platform guards and yokai. It cannot replace mandatory cedar or spirit ash.
- The Crooked Carp inn now supports three bounded session decisions: healing, a permanent-session katana whetstone, or a one-expedition fog charm.
- The judged loop is now explicit in play: recover the clapper, gather cedar, defeat yokai for ash, retreat under rising fog, convert resources into one repair, repeat under stronger pressure, and defend the ward bell.

### Corrections made

- Rebuilt the inn interior as a readable service space with an innkeeper, counter, rooms, bath, table, exit, contextual TRADE interaction, solid furniture, and a full shop screen.
- Added mon to the HUD and connected platform combat and yokai combat to the inn economy.
- Replaced the late Warrior's Knot gathering bonus, which arrived after gathering was finished, with final-breach health and healing-on-kill benefits.
- Increased fog pressure to become consequential within a short expedition and added halfway and critical warnings plus color-changing meter feedback.
- Generated and integrated an original orthographic Edo wilderness map with a safe-to-haunted vertical progression, replacing the programmer-art expedition road.
- Replaced rectangular resource boxes with readable bound-cedar pickups and improved wisps, prowlers, raiders, and the gate oni into distinct pixel-art silhouettes.
- Tightened outside travel bounds around the readable road and tightened inn collision around the counter, rooms, innkeeper, and table.
- Corrected HUD overlap between resources and fog/bell meters.

### Verification

- Verified title, inn, shop purchase, expedition, repair decision, Forest Spirit Path controls, and final-breach presentation in a portrait browser.
- Verified JavaScript syntax, local-only asset references, and a total project size of 15.90 MB before final packaging.

### AI involvement

- Codex implemented and playtested the loop/economy pass and created the original `edo-outskirts-v1.png` environment with the built-in image-generation tool.

## 2026-08-25 — Coherent route, functional town, and compact HUD

### Structural correction

- Removed the arbitrary building/ladder → platformer → far side of North Gate route.
- The clapper thief is now a short marked top-down chase that ends in town and explicitly opens North Gate.
- Run one uses Cedar Road and the visible return gate. Run two uses Cedar Road's Spirit Trail, one Forest Spirit Path traversal, the cursed-shrine expedition, and a direct shrine return shortcut.
- The platform route now reveals a new high-risk resource region instead of replacing a gate the player could already use.

### Town and economy

- Rebuilt Post Town as a camera-tracked T-shaped map with Japanese machiya façades, a north gate, a south lane, one ward bell, moving residents, and independently coded solid geometry.
- Removed the duplicate coded yellow bell and obsolete ladder route.
- Gave both enterable buildings a single readable function: the Crooked Carp fully heals for 1 mon; Sparrow Forge sells a 3-mon whetstone and 2-mon fog charm.
- Added resident dialogue, physical NPC/enemy separation, functional door interactions, and corrected bell, wall, roof, and foreground collision.

### Combat and presentation

- Added a red target ring and marker to distinguish the clapper thief from residents and tuned his local evasion for touch play.
- Grounded Forest Spirit Path characters on coded terrain; guards now patrol, chase, telegraph, attack, knock back, and award mon.
- Replaced the oversized top slab with a 48-pixel HUD, narrow objective ribbon, edge fog/bell meter, smaller braided movement control, katana seal, and context seal.
- Corrected safe/danger status for town combat, the Spirit Path, cursed shrine, and final breach.

### Original generated assets

- `assets/environment/edo-town-district-v3.png` — original 1605 T-shaped merchant district with one bell, inn, forge, south lane, and North Gate.
- `assets/environment/cursed-shrine-v1.png` — original blue-dusk Shinto shrine/graveyard expedition map with open clearings and a return gate.
- Both assets were created with the built-in image-generation tool and integrated as local offline files.

### Verification

- Parsed the embedded JavaScript successfully with Node after the route and UI changes.
- Visually tested the live portrait build at title, town, thief chase, roof/bell collision, inn, forge, Cedar Road, Spirit Trail, Forest Spirit Path, cursed shrine, and final breach.
- Confirmed that the gate and trail interactions communicate the world graph and that the player stops at the town bell/roof geometry.

## 2026-08-25 — Gate-to-field chase and collision completion

### Route correction

- The thief now escapes visibly through North Gate instead of being defeated in town or using a building as a hidden transition.
- The first outside visit is a top-down pursuit across one explorable haunted field with connected clearings, a sealed future gate, and a distinct upper-right torii.
- The torii leads to the single side-view Forest Spirit Path, where the player defeats three guards and a three-hit clapper thief.
- Finishing the pursuit returns the player to the field side of the torii. The player walks south and explicitly returns through the town gate.
- Later North Gate visits reuse the field as the survival-and-resource map; the story chase and platform route do not repeat.

### Town, service, and collision corrections

- Tightened lower-building and foreground-roof collision while retaining the central south lane and shallow building recesses.
- Added a visible closed south-road boundary rather than allowing the player to walk off the illustrated map.
- Changed moving residents to pause and separate on contact instead of reversing every frame and glitching under the hero.
- Made inn and forge keepers solid, stationary, dedicated service characters with larger readable interaction ranges.
- Opened the interior center aisle, moved table collision out of the approach path, and verified REST and TRADE actions.

### Combat and progression corrections

- Grounded all four side-view opponents on authored terrain and gave the three guards one hit each.
- Marked the final thief with a target arrow and health bar; he requires three hits before the far torii unlocks.
- Platform completion awards mon and restores the top-down field route instead of teleporting directly into town.

### Original generated assets

- `assets/environment/haunted-field-v1.png` — original portrait haunted-field map with broad clearings, south town gate, north demo boundary, and upper-right torii.
- `assets/characters/town-services-v1.png` — original transparent two-character sheet containing a stationary innkeeper and swordsmith.
- Both assets were created with the built-in image-generation tool, copied into the offline package, and integrated locally.

### Verification

- Visually checked the town escape, North Gate entry, lower and upper haunted-field route, torii transition, Forest Spirit Path start/final target, field return, town return, inn REST action, forge TRADE action, and shop screen in a portrait browser.
- Removed all temporary query-string QA entry points before delivery.

## 2026-08-25 — Painted-map collision, interiors, and HUD pass

### Screenshot-driven corrections

- Replaced broad rectangular field navigation with an authored network of dirt-road corridors and clearings matched to the actual haunted-field painting.
- Added explicit water, stream, cedar-mass, sealed-gate, and foreground geometry so the hero can no longer walk into the creek or through the central trees.
- Repositioned the thief route, yokai spawns, and every cedar node onto valid dry terrain.
- Replaced permissive town-building rectangles with explicit merchant-street, north-lane, south-lane, and doorway walkable zones.
- Added a foreground town render layer so lower roofs correctly occlude actors, and tightened the street edge so the hero stops before the roof.

### Original generated interiors

- `assets/environment/crooked-carp-interior-v1.png` — original early-Edo inn interior with a readable counter, bath door, room screen, open aisle, and south exit.
- `assets/environment/sparrow-forge-interior-v1.png` — original early-Edo swordsmith workshop with recessed hearth, counter, tools, weapon racks, open aisle, and south exit.
- Both were created with the built-in image-generation tool and integrated as full portrait room backgrounds. Live characters, collisions, HUD, labels, and interactions remain code-driven.

### Interface and pressure feedback

- Rebuilt the HUD as layered dark-lacquer and brass pixel-art chrome with clearer health, resource, status, objective, fog, and bell hierarchy.
- Rebuilt the touch controls with continuous rings, bevels, readable icons, and distinct movement/action/context color roles.
- Replaced the thin edge fog bar with a labeled horizontal meter and moved run messages below it.
- Reduced first-run fog growth from 2.45% to 0.84% per second and second-run growth from 3.35% to 1.12% per second.
- Added a five-second full-fog grace window, reduced drain to four health every 1.5 seconds, and added explicit south-road escape language.
- Rebuilt defeat presentation so fog and platform deaths name their actual cause instead of always reporting a failed bell defense.

### Verification

- Forced the hero toward a creek interior, central cedar mass, and foreground town roof; each test stopped on the intended visible boundary.
- Visually verified the generated inn and forge, new HUD and touch controls, critical-fog state, and fog-specific defeat screen in the portrait browser.
- Removed temporary QA entry points after testing and rechecked the clean startup build.
- Fixed repeated inn and forge exits drifting Yusuke into foreground roofs by using stable exterior landing points.
- Clear touch/tap movement whenever a map transition occurs, preventing interior coordinates from carrying into town.
- Added a short door-transition cooldown and moved return landings outside the automatic re-entry radius.
- Replaced the always-rising expedition timer with readable fog fronts: clear exploration windows, a wind warning, a nine-second surge, and a recovery lull.
- Fog only damages Yusuke during a full-pressure active front; pressure drops sharply when the front passes and continues receding during calm weather.
- Updated objectives, HUD states, field mist, Fox-Smoke Charm, and Braided Ward Rope language around the new front-based hazard.
- Made progression visible in the town itself: each repair choice now adds distinct rope, clapper, talisman, or warrior-knot treatment to the ward bell.
- Added an in-world WARD 1/2 or WARD 2/2 plate and repair-install messaging so gathering-to-conversion feedback is unmistakable during one judging session.
- Ran an automated full state-chain audit covering the opening, field chase, Spirit Path, both gather-and-repair runs, final bell defense, victory, and clean reset; every transition passed without runtime errors.
- Removed the temporary audit entry point after verification.
- Built a game-only candidate ZIP containing the root index, the nine runtime-referenced local images, and an empty vendor directory; it is 19.49 MB with zero runtime network references.
- Extracted that exact ZIP into a clean directory, served it independently, opened the title, started a session, and confirmed the painted town and sprites loaded with no browser runtime errors.
- Added explicit defeat causes so fog, field-yokai, platform-guard, ravine, fallen-defender, and shattered-bell losses report the event that actually ended the run.
- Fixed platform combat so enemy damage reaching zero health immediately ends the session instead of leaving Yusuke active until a later fall.
- Removed the duplicated town-image foreground mask that could visually bury actors beneath a second roof copy.
- Replaced roof-adjacent walkable pockets with an explicit main street, north lane, south lane, and bell courtyard matched to the painted map.
- Moved the scripted clapper thief spawn and escape route onto the valid road centerline so his collision radius can no longer trap him at the first waypoint.

### Open-map rebuild

- Generated and integrated `assets/environment/post-town-open-v4.png`: a sketch-driven perimeter town with one upper building band, one lower building band, a broad central plaza, and direct north/south travel lanes.
- Generated and integrated `assets/environment/haunted-field-open-v2.png`: a readable rectangular combat field with decorative obstacles held to the perimeter, a south town gate, north seal, and upper-right spirit trail.
- Replaced illustration-tracing collision with simple authored walkable rectangles that match the open play spaces, eliminating roof, stream, and under-map traversal.
- Moved the inn, forge, bell, gates, thief route, and field landmarks onto the new playable geometry.
- Changed town residents to pause before overlapping Yusuke instead of reversing inside his collider; player movement now also preserves a wider personal-space radius.
- Added air momentum and a forward impulse to platform jumps, with stronger ground steering and weaker air steering, so gaps require a committed Mario-like arc rather than a vertical elevator jump.
- Browser-verified NPC separation, the North Gate field spawn, and a forward jump across the first Spirit Path gap before removing the temporary QA hooks.

### Character and interface nuance pass

- Generated `assets/characters/edo-citizens-v1.png`, a strict six-cell atlas containing the magistrate, fisherman, townswoman merchant, clapper thief, innkeeper, and female swordsmith in one consistent chibi pixel-art scale.
- Replaced the resident animation bug that alternated mayor and thief artwork with fixed identities plus code-driven walk bobbing and direction flips.
- Reused the same citizen atlas inside the inn and forge so service characters now match the hero and town population instead of appearing as oversized illustrations.
- Added a north/south directional katana sweep layered over the correct top-down hero facing, fixing the missing north-facing attack read.
- Rebuilt the HUD, objective ribbon, and notice overlay with chamfered lacquer panels, brass linework, red seal accents, and labeled CED/ASH/MON resource groups.
- Clarified cedar's function at pickup and through merchant dialogue: cedar fiber combines with spirit ash to purchase one visible ward-bell repair after each expedition.
- Browser-verified the north slash, roaming citizen treatment, innkeeper, swordsmith, updated overlays, and clean runtime logs before removing the temporary QA modes.

### Final presentation and replay pass

- Generated and integrated `assets/ui/title-town-dusk-v2.png`, an original portrait early-Edo title backdrop with a lantern street, central ward bell, mountain, and restrained spirit wisps.
- Generated and integrated `assets/ui/edo-ui-skin-v1.png`, a reusable charcoal-washi, lacquer, brass, ward-rope, and talisman interface skin with empty live-data regions.
- Rebuilt the title screen, gameplay HUD, objective ribbon, notice overlay, repair menu, forge shop, and outcome screen around the raster UI skin while keeping all text, counts, health, fog, and costs code-driven.
- Made the forward/south katana attack unmistakable with a 0.24-second lunge, full directional blade, bright sweep trail, and brass secondary arc; the north-facing version uses the same complete motion language.
- Rewrote the repair presentation to explain the resource loop at the decision point: cedar fiber forms the physical repair and spirit ash seals the ward.
- Reopened the Spirit Path as an optional repeatable side route during both supply expeditions. Three guards award mon, the far torii returns Yusuke to the same field state, and the paused fog front resumes rather than resetting.
- Browser-verified the new title, repair choice screen, forge shop, gameplay HUD, forward katana animation, replay entry, replay return, and outcome screen with no runtime warnings.

### Final platform and gate polish

- Generated and integrated `assets/environment/spirit-path-platform-v2.png`, a full-height early-Edo cedar shrine backdrop authored for the side-view level rather than a shallow scenic strip.
- Reframed the Spirit Path art as a tall 16:9 crop with restrained parallax so the portrait viewport pans through a continuous environment without stretching the source image.
- Replaced the hero sheet's defective airborne cell—which contained a baked white streak—with a clean, tilted side pose driven by jump velocity.
- Centered and enlarged Yusuke inside the HUD portrait recess and moved his name onto a dedicated dark brass-edged plate for legibility.
- Removed the south gate's walkable roof corridor, moved field spawns in front of the new boundary, and prioritized the RETURN/TOWN interaction over nearby gather nodes.
- Browser-verified an airborne frame, a complete landing, the HUD portrait, and sustained movement into the south gate boundary before removing the temporary polish hooks.

### Contest-demo break pass

- Ran a 15-case destructive state-chain audit covering repeated inn entry/exit, forge exit, one-time upgrades, per-expedition smoke purchases, premature gate returns, both repairs, Spirit Path replay restoration, victory, full reset, sustained gate collision, and repeated ravine deaths; every case passed.
- Verified the smallest portrait layout and the landscape orientation safety screen, with no browser runtime warnings.
- Corrected the return-gate objective to report the remaining cedar and ash rather than repeating the original requirement.
- Changed Fox-Smoke from a permanent one-purchase flag into a true per-expedition consumable: it cannot be purchased twice for the same run, is consumed on departure, and can be bought again before the second run.
- Removed the temporary stress-test entry point after verification.
- Repacked the final candidate with an explicit empty `vendor/` directory so its structure matches the competition's documented validator layout even though the game uses no third-party libraries.

### Progression readability pass

- Audited every bell repair and forge purchase for both mechanical and visual effect. Bell repairs already changed the bell artwork and mechanics; forge effects worked mechanically but were too implicit.
- Added live HUD progression readouts for blade damage, installed ward repairs, fog resistance or prepared fox-smoke, and current/max health.
- Added a subtle empowered-blade glint and orbiting fox-smoke wisps so both forge purchases change Yusuke's presentation as well as the numbers.
- Browser-verified a two-repair, upgraded-blade, prepared-smoke state with no runtime warnings, then removed the temporary visual test entry point.

### Public mobile test deployment

- Added a Vercel-specific exclusion list so the hosted test contains only the playable runtime and currently referenced assets, not submission documents, local test scripts, packaged builds, or superseded environment artwork.
- Deployed the current prototype to `https://mhcp-game-prototype.vercel.app` for HTTPS testing on iPhone without an Apple Developer account.
- Visually verified the production deployment in a browser: the live URL loads the portrait title screen, game artwork, and interactive canvas successfully.
- Stopped the temporary local-network test server after the HTTPS deployment replaced it.

### Yokai and Spirit Path art pass

- Generated a two-state, four-character yokai atlas containing an original masked hitodama, cedar prowler, shrine raider, and gate oni boss; replaced the field's procedural enemy blocks with the new idle and attack/telegraph sprites.
- Generated a matching Spirit Path foreground atlas containing a mossy cliff, timber shrine bridge, fallen-cedar ramp, and stone stair ramp, then removed the checkerboard matte during asset initialization for clean canvas compositing.
- Expanded the Spirit Path world from 920 to 1,320 units, added two more traversal surfaces, repositioned all guards and the clapper thief, and extended the parallax environment across the longer route.
- Replaced constant-height platform collision with authored sloped segments so the cedar and stone ramps are physical routes rather than decorative artwork.
- Browser-verified the generated terrain, ramp contact, hero placement, hitodama, prowler, raider, and oni boss before removing the temporary visual-QA entry points.

### Grounding and character-motion correction

- Reproduced the iPhone-reported levitation: sprite cells used one generic bottom offset even though each animation row had a different internal foot position, leaving visible space between feet, shadows, and collision surfaces.
- Measured the last occupied pixel in every hero, citizen, and Spirit Path enemy animation row and applied per-frame foot anchors so changing pose never changes world-space height.
- Removed sinusoidal vertical bobbing from town residents and the speaking magistrate; motion now comes from alternating left/right walking poses with a fixed foot baseline.
- Generated and integrated `assets/characters/edo-citizens-walk-v1.png`, containing two grounded walking poses for the magistrate, fisherman, townswoman, clapper thief, innkeeper, and swordsmith.
- Generated and integrated `assets/characters/spirit-path-enemies-v1.png`, containing grounded idle, running, and attack poses for an ashigaru guard, masked shrine outlaw, and clapper thief.
- Replaced every old static/procedural platform character fallback with the new raster enemy atlas and added tightly anchored shadows under town residents, service characters, the clapper thief, Yusuke, and path enemies.
- Removed all enclosed checkerboard matte from the generated terrain atlas, eliminating white holes between bridge posts, and removed the old procedural terrain fallback so it cannot flash during slow mobile asset loading.
- Added a player-only North Gate threshold on the town side. Yusuke stops at world Y=646 with ENTER available, while the scripted thief can still cross the gate; this matches the field-side return behavior.
- Browser-verified town shadows, walking-frame grounding, Yusuke standing directly on the timber platform, clean bridge transparency, and the town-side gate stop before removing temporary QA hooks.

### Adaptive original soundtrack pass

- Audited five supplied original music recordings by section, measuring tempo, energy, spectral character, and scene affinity rather than embedding entire MP4 videos.
- Cut and loudness-normalized five compact MP3 loops: `Sun Over the Mountain Gate` for title/town, `Sunlight on the Blade` for field exploration, `Kinetic Protocol` for the Spirit Path chase, `Kinetic Protocol 2` for nearby field danger, and the preferred `Beneath the Shattered Ceiling` passage for the final bell breach.
- Added adaptive music routing with enemy-proximity hold time so the field score does not rapidly flicker between exploration and danger cues.
- Added first-gesture mobile audio unlocking, scene-safe looping, gentle fade-in on track changes, a touch mute control, and keyboard `M` support.
- Kept the complete production soundtrack to 1.36 MB and excluded unused alternate WebM encodes from deployment.

### Spirit Path transparency cleanup

- Re-extracted the four Spirit Path terrain pieces from their baked gray-and-white checkerboard matte and produced a real 2172×724 RGBA atlas with transparent bridge openings and cleaned edge halos.
- Replaced runtime color-key guessing with the finished transparent atlas, eliminating white blocks and checker fragments on mobile.
- Removed the unrelated code-drawn ravine gradient, five horizontal mist bars, and floating yellow destination triangle so no placeholder/vector-like overlay sits over the painted environment.
- Browser-verified the opening cliff, timber bridge, stone stair ramp, character grounding, and enemy placement with no runtime warnings, then removed the temporary QA entry point.
- Follow-up high-contrast bridge inspection found pale semi-transparent RGB retained along the bridge bays from the original flattened white matte. Rebuilt the atlas with hard pixel-art alpha—311,967 fully opaque terrain pixels, 1,260,561 fully transparent pixels, and zero partial-alpha fringe pixels—so the vertical spans cannot reveal white halos over the dark forest.

### Mobile readability and animation pass

- Replaced the fractional-width town atlas with an exact 6×2 side-facing citizen sheet. Fisherman, merchant, townswoman, innkeeper, and swordsmith now have grounded left/right walk poses without sampling adjacent characters or appearing to moonwalk.
- Kept the clapper thief on a separate cropped atlas so the new merchant art cannot accidentally replace the antagonist during the opening escape.
- Expanded the yokai presentation to distinct idle, locomotion, and attack rows for the hitodama, cedar prowler, shrine raider, and oni; movement and telegraph states now select visibly different artwork.
- Generated and integrated a transparent raster control sheet for the joystick, slash, jump, talk, and doorway actions, replacing the most visibly code-drawn mobile controls while preserving live contextual labels.
- Raised and enlarged Yusuke inside the HUD portrait recess and lightly blended the HUD over the world so the portrait no longer sits low in its frame.
- Rebuilt transient notices as narrower, taller, centered cards with larger type, stronger spacing, shorter maximum duration, and a quicker final fade.
- Moved both interior walkable bounds below their counters and redrew the counter foreground over each keeper. Yusuke can no longer stand on the forge or inn desk, and both service characters now read as standing behind it.
- Moved post-chase and post-repair town returns deeper into the street, away from the North Gate fence and bell-yard trim.
- Added a visible midair katana pose, two-layer slash arc, small forward impulse, wider airborne hit tolerance, and immediate aerial damage so jump-slash no longer waits for landing.
- Removed the procedural town-silhouette first-paint fallback. Slow-loading devices now see a clean dark load frame until the authored title artwork is ready.
- Phone-viewport browser verification confirmed the title, raised portrait, raster controls, centered notice lifecycle, opening chase transition, and zero runtime warnings.
- A follow-up screenshot exposed one remaining map-mask error: the narrow south-gate rectangle extended through the painted gatehouse roof. Removed that false walkable corridor and added a hard eave collider, so the lower plaza now stops on dirt in front of the closed gate instead of allowing Yusuke onto its tiles.

### Transparent gameplay-overlay correction

- Removed the ornate generated UI skin from the live HUD, task ribbon, and transient notices after annotated screenshots showed its stretched raster regions muddying the world art.
- Rebuilt the gameplay HUD as three independent translucent glass regions with native one-pixel brass lines. The portrait, status, progression, and resource values remain readable while the active map remains visibly continuous underneath.
- Replaced the stretched objective and notice art with simple translucent map overlays, thin separators, larger live text, and no ornamental texture sampling. Full-screen repair, shop, title, and outcome artwork remains unchanged.
- Added a dedicated front-facing town-official pose. The official faces forward when Yusuke approaches vertically and turns left or right when approached from the side.
- Corrected each citizen walk frame's foot anchor, increased patrol speed, and replaced the red outlaw-like merchant pose with a civilian tradesman. Browser captures half a second apart confirmed both horizontal travel and alternating leg poses without vertical baseline movement.
- Phone-viewport verification confirmed the transparent HUD, unstretched notice, responsive official facing, moving resident, and clean runtime logs.
- Follow-up HUD alignment pass centered Yusuke, his nameplate, health bar, and health text on the actual portrait panel; aligned Blade/Ward/Fog and Cedar/Ash/Mon to shared three-column centers; enlarged location names while preserving a smaller secondary-data tier; and made notice height follow its real wrapped-line count to remove excess negative space.
- Optical follow-up moved only Yusuke's portrait sprite three pixels left, centered the south-gate plaque/rope/posts on the painted gatehouse's true world X=540 instead of X=523, and compressed notice headers by 15 pixels while lowering panel opacity to keep more map texture visible.

### Directional civilian animation pass

- Generated and integrated `assets/characters/edo-citizens-verticalwalk-v1.png`, an exact 6×4 atlas with two toward-camera and two away-camera walk steps for all six established civilian identities.
- Widened the official's vertical facing cone: he now faces forward when Yusuke approaches from below, shows his back when approached from above, and only turns sideways for a clear lateral approach.
- Changed the merchant and townswoman to north/south patrols while retaining the fisherman's east/west route, demonstrating side, forward, and back movement within the opening plaza.
- Kept every directional frame on a fixed foot baseline and verified two merchant frames half a second apart: clear leg/arm changes and forward travel without vertical bounce.
- Corrected the opacity interpretation after follow-up feedback: gameplay HUD glass increased to roughly 77% opacity, the task strip to roughly 72%, and notices to roughly 74%, reducing map bleed-through while preserving the overlay-only design.

### Interior service-character restoration

- Diagnosed both interior failures as foreground-layer registration errors: the innkeeper baseline placed him on the customer floor, while the forge counter crop began high enough to repaint over the swordsmith's body.
- Moved both service characters behind their authored counter positions, changed them to front-facing sprites, and limited the foreground redraw to the lower counter face so only their hidden lower bodies are occluded.
- Enlarged the innkeeper to 82 pixels and the slimmer swordsmith to 86 pixels for comparable visual presence above their differently proportioned counters.
- Verified both interiors directly at a phone viewport with a temporary local preview route, confirmed clean runtime logs, and removed the preview route before deployment.

### Civilian shadow registration pass

- Measured the actual opaque foot line in every sidewalk, portrait, and four-row vertical civilian frame instead of using one guessed offset for each sheet.
- Applied per-frame foot anchors so the chief, fisherman, merchant, townswoman, and service characters stay planted on one ground baseline as they turn or alternate walk steps.
- Removed the full red ellipse from the opening bandit's marker; the directional arrow remains, so the target cue no longer reads as an exposed circle under the character.
- Local phone-viewport verification confirmed the chief's body and shadow meet cleanly in the forward pose; the existing boundary/input regression suite remains green.
