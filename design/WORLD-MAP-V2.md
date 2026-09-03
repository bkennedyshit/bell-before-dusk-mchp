# Bell Before Dusk — World and Combat V2

## The correction

The phone is a viewport, not the level. The first prototype treated one portrait illustration as both scenery and geometry. V2 separates those concerns:

- The player remains the same size everywhere. There is no perspective scaling.
- A camera follows the player over a larger orthographic map.
- Buildings, walls, roofs, trees, and fences are solid geometry.
- Doors and gates are explicit interactions that connect distinct maps.
- Town maps are safe social/navigation spaces; journey maps contain yokai and resource pressure.
- The katana is always an attack. Talking, entering, climbing, gathering, and ringing are contextual interactions.

## Research translated into this game

*Mystical Ninja Starring Goemon* uses towns, interiors, highways, fields, and castles as connected areas rather than one continuous painted scene. Its towns contain NPCs, shops, inns, and plot information; gates lead to journey areas where enemies appear. The N64 game is fully 3D, but its useful structural idea can be translated into a fixed-scale 2D mobile game without copying its characters, locations, or content.

References:

- Nintendo Life describes the overworld as large interconnected rooms: https://www.nintendolife.com/reviews/n64/mystical_ninja_starring_goemon
- The N64 manual separates town/journey/castle controls and uses nearby interaction for NPCs: https://www.videogamemanual.com/n64/Mystical%20Ninja%20Starring%20Goemon%20(USA).pdf
- The walkthrough shows Oedo gates connecting to Kai Highway, guarded bridges, houses, coffee shops, and later regions: https://gamefaqs.gamespot.com/n64/198022-mystical-ninja-starring-goemon/faqs/3273
- The making-of emphasizes a world rich in Japanese character and the fun of traveling between places: https://www.timeextension.com/features/the-making-of-mystical-ninja-starring-goemon-konamis-underrated-n64-classic

## Contest-sized world

This is a micro-adventure, not an open world. The complete judged run uses six compact spaces:

1. Post Town — a wide east/west merchant street joined to a south lane, with residents, official, bell, inn, forge, and North Gate.
2. Crooked Carp — a small healing interior and future save location.
3. Sparrow Forge — a small equipment interior with two bounded purchases.
4. Haunted Field — one broad top-down map with the town gate at the south, multiple connected clearings, a sealed future gate at the north, and a torii trail at the upper right. It first hosts the thief pursuit, then becomes the resource-and-fog expedition map.
5. Forest Spirit Path — one side-view pursuit with grounded terrain, three guards, the clapper thief, and a far torii.
6. Bell Yard — the town finale using the same town geometry under active yokai pressure.

The town is one 1080×720 orthographic map behind a portrait viewport. Horizontal movement reveals the merchant street; the south branch gives it city depth rather than turning every area into one corridor. Solid building, roof, bell, official, resident, and enemy geometry is independent from the painting. The haunted field is 720×1080 and allows both horizontal exploration and north/south travel through connected clearings. Journey spaces load only through explicit gate or torii interactions.

## Loop

Town briefing → thief escapes through North Gate → chase through the haunted field → clear three guards and the thief on the Forest Spirit Path → return through the field and town gate with the clapper → heal or buy equipment → re-enter the now-hostile field → gather cedar and yokai ash under rising fog → explicitly return through the gate → choose one repair → repeat a harder field run → choose the second repair → defend the bell.

Every scene supports the Survival & Resource Management category:

- cedar and ash are limited run resources;
- mon is an optional risk reward dropped by guards and yokai, used only for healing, steel, or a one-expedition fog charm;
- fog creates a return-pressure clock;
- repair choices trade safety, damage, health, and gathering efficiency;
- the final bell defense makes earlier resource choices visible.

## Controls

- Left thumb: continuous movement.
- Katana button: always attacks when the sword is owned.
- Context button: appears near a person, door, ladder, resource, gate, or bell.
- Keyboard: WASD/arrows; J/Space attack and E interact in top-down areas; J attacks and Space jumps on the Forest Spirit Path.

Attack no longer doubles as conversation or gate travel.

## Collision and interaction rules

- Each map owns `colliders`, `exits`, `interactions`, `npcs`, and enemy spawn zones.
- Movement resolves the X and Y axes separately against solid rectangles.
- NPCs and enemies have body collision and separation.
- A door activates only while the hero is within its interaction radius and facing/pressing the context action.
- No automatic transition occurs merely because the hero crosses an arbitrary Y coordinate.

## Enemy minimum behavior

All combat actors use readable states:

`idle/patrol → notice → chase or flee → telegraph → attack → recover → hit-stun → defeated`

- The thief follows a readable escape route through town and the haunted field, then becomes a three-hit target at the end of the side-view pursuit.
- Yokai wander until aggroed, chase, telegraph before contact damage, and recoil when hit.
- The final raiders can choose the bell as a target.

Side-view guards occupy the coded ground baseline, patrol bounded ledges, chase on the same level, display a warning before striking, damage and knock back the hero, and drop mon when defeated.

## Art rules

- Straight-on or orthographic façades; no vanishing point.
- Constant character scale.
- Foreground roofs can frame the bottom of the viewport but are non-walkable blockers.
- Repeating wall/window/door modules make the town economical to build.
- Edo-period inspiration, circa 1605, with original names and characters.
- Humorous dialogue and reactions, but no copied Goemon characters, costumes, maps, music, or story beats.
