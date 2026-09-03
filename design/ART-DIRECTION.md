# Prototype Art Direction

## Locked direction

The contest prototype uses a **2D, top-down, tile-based presentation** inspired by the clarity and economy of 16-bit action-adventure games.

The reference is a level of visual abstraction, not a source of characters, maps, interface, animation, terminology, music, or other protected expression.

## Why 2D

- No 3D character modeling, rigging, skinning, or camera system.
- Small, countable asset set.
- Reliable touch targeting and combat readability.
- Easy to compose for a fixed portrait screen.
- Fast iteration on the scored gameplay loop.
- Straightforward offline packaging below 35 MB.
- Leaves the winning completion rebuild free to reinterpret the same loop in richer 3D.

## View and composition

- Top-down or slightly elevated 3/4 view.
- Fixed portrait viewport.
- Tile-based world arranged vertically.
- Foreground roofs or parapets may frame the bottom edge without covering controls.
- The town street and bell-conversion area sit in the safe lower portion of the route.
- A gate creates a legible threshold into gathering and yokai territory above it.
- Final-threat area at the top.
- Camera follows only enough to keep the hero and immediate danger readable.
- No rotation, zoom requirement, parallax dependency, or free camera.

## Visual principles

- Original Japanese-folklore-inspired world and characters.
- Architecture, clothing, weapons, roads, and ordinary props are grounded loosely in Japan circa 1605, interpreted through an original colorful supernatural style rather than strict historical simulation.
- Clear safe/combat contrast: ordinary warm streets and bell yard versus cool mist-heavy outskirts.
- Human trouble uses warm town lighting and grounded silhouettes; yokai appear only beyond the gate or during the final breach.
- Chunky silhouettes readable at phone size.
- Limited palette with clear danger, resource, safe-zone, and upgrade colors.
- Small number of high-value animations.
- Strong hit flashes, knockback, particles, resource bursts, and barrier-state changes.
- Large readable interface elements; no imitation of a specific legacy game's HUD.
- The prototype remains top-down, with at most one short side-view traversal using the same character and effects vocabulary.

## Initial asset ceiling

### Environment

- One outdoor tile atlas.
- Six reusable town facade/eave modules plus two foreground roof/parapet modules.
- One gate, one bell yard, one ladder transition, and one short side-view roof kit.
- One outskirts ground set and 8–12 reusable props: lantern, tree, rock, cedar node, gate, fence, ash pickup, damaged bell, and talisman.

### Characters

- One hero sprite.
- Two normal spirit/enemy sprites.
- One final-threat sprite.
- Optional static guardian or shrine figure only if it improves onboarding.

### Hero animation

- Idle.
- Walk in four directions.
- Attack in four directions.
- Charged attack or ward action.
- Hit and defeat.

### Enemy animation

- Idle/move.
- Attack.
- Hit.
- Defeat.

### Effects and interface

- Hit effect.
- Gather effect.
- Resource pickup effect.
- Upgrade effect.
- Barrier damage/repair effect.
- Health, barrier, two resources, objective, upgrade selection, outcome, and restart UI.

## Asset production rule

No bespoke asset is produced until its gray-box gameplay function works. Placeholder geometric sprites and tiles are acceptable until the full session can be completed and restarted.

## Future rebuild

If the prototype wins, preserve the core loop, timings, economy, enemy roles, escalation, and level topology. The completion rebuild may reinterpret the presentation with richer 3D assets if the Early Access Creation Tools support them.
