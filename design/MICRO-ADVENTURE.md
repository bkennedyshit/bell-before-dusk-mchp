# Micro-Adventure — Competition Design Specification

## Submission category

**Survival & Resource Management**

The game must visibly contain all three required genre elements:

1. The player gathers or collects resources.
2. The player converts resources into something more useful through crafting, refining, or upgrading.
3. The player survives an escalating threat that creates a real gather-versus-defend tradeoff.

Adventure, exploration, combat, farming, characters, and story support this loop. They do not replace it.

## One-sentence experience

Recover a sabotaged town bell's clapper, venture beyond the safe gate for repair materials, return to convert them into visible bell and hero upgrades, and survive the dusk breach.

## World and tone

- Original Japanese supernatural setting in 1605, during the Keichō era and the Momoyama-to-early-Edo transition.
- The province, settlement, shrine, hero, spirits, and events are fictional; the historical year anchors material culture rather than dictating the plot.
- Ordinary streets and the bell yard communicate safety; human bandits appear only in a stated town incident.
- The outskirts and final gate breach are marked by heavy mist, altered color, and hostile yokai.
- The hero uses a katana introduced during the town opening.
- One explicit side-view roof chase recovers the stolen bell clapper. It is a short onboarding incident, not a separate progression system.
- See `TOWN-OUTSKIRTS-REVISION.md` for the locked route, narrative logic, camera transitions, and revised asset ceiling.

## Core loop

**Cross the town gate → gather and fight in the outskirts → decide when to return → repair the bell or hero → face greater fog pressure → repeat → defend the gate.**

The player should reach the first meaningful upgrade within 60–90 seconds.

## Session structure

Target length: **6–10 minutes**.

### Opening — 60–90 seconds

- The player begins on one safe town street and immediately receives the complete objective.
- One human bandit introduces the katana.
- An explicit ladder begins a short side-view roof chase for the stolen bell clapper.
- Returning the clapper unlocks the town gate and the resource-survival loop.

### Cycle 1 — Learn

- Gather two basic resource types.
- Fight one readable enemy type.
- Return voluntarily or when the warning begins.
- Choose one of two upgrades.
- Survive the first attack.

### Cycle 2 — Decide

- Resources are farther away or more contested.
- A second enemy behavior appears.
- The player must choose between gathering longer and returning safely.
- The second upgrade creates a distinct build direction.
- The next attack combines threats.

### Cycle 3 — Commit

- Resource pressure and enemy pressure peak.
- The player prepares one final upgrade or defense.
- A final threat attacks or must be confronted.
- The game reaches an explicit victory or defeat state.

### End-or-again

- Show survival result, score, and major choices.
- Present a large immediate restart button.

## Primary actions

- Move through a compact field.
- Tap an adjacent resource or contextual action control to gather.
- Tap/hold one combat control for a basic and charged attack.
- Select one upgrade when safely back at the shelter.

No action may require hover, right-click, a keyboard, precise rotation, or multi-touch.

## Resources and conversion

Prototype with only **two gathered resources** and **one temporary survival meter**.

- Resource A: common material used for direct defenses or tool strength.
- Resource B: risky material used for healing, special attacks, or stronger upgrades.
- Survival meter: health, shelter integrity, time, hunger, or another immediately readable pressure.

Every gathered resource must have an obvious use. No decorative inventory items.

## Upgrade philosophy

Each return offers two mutually exclusive or resource-limited choices, such as:

- Gather faster versus deal more damage.
- Improve the hero versus reinforce the shelter.
- Gain safety now versus increase future resource yield.

Upgrades must visibly change play, not merely increase an invisible statistic.

## Escalation

Escalation happens inside the single judged session through:

- Less safe gathering time.
- Greater enemy pressure.
- New enemy behavior rather than only more health.
- Increasing cost of preparation.
- A final threat that tests the player's accumulated choices.

No progression may depend on returning for another session or loading a save.

## Win and lose conditions

**Win:** survive the final escalation and defeat or repel the final threat.

**Lose:** hero health or shelter integrity reaches zero.

**Reset:** available from both outcome screens and the pause menu.

## Portrait presentation

- Fixed portrait viewport.
- 2D top-down, tile-based world; no 3D character-production requirement.
- Status and current objective at the top.
- Compact world in the central area.
- Large contextual controls and resource/upgrade tray near the bottom.
- Fixed or lightly following camera; no player-controlled rotation.
- All important pieces distinguishable by silhouette, color, and motion.

## Scope ceiling for the first complete build

- One shelter interior.
- One outdoor field.
- One playable hero.
- Two normal enemy behaviors.
- One final threat.
- Two gathered resources.
- Four to six meaningful upgrades.
- Three escalation cycles.
- One victory and one defeat sequence.

Anything beyond this ceiling is considered only after the entire session works offline from start through restart.

## Explicitly excluded

- Multiplayer.
- Multiple towns or dungeons.
- Open-world exploration.
- Quest log.
- Dialogue trees.
- Random encounters that switch to a separate battle system.
- Large crafting trees.
- Persistent saves or meta-progression.
- Dynamic weather or day/night simulation.
- Physics vehicles, ragdolls, or complex character animation.
- External web services or network-loaded assets.

## Competition scoring intent

### Player Engagement — 30%

- Immediate movement, gathering, and combat feedback.
- Constant tension over whether to stay out or return.
- Upgrades that make the player want to test another build.

### Playability — 25%

- Touch-first controls, a short onboarding, visible objectives, and a complete reliable session.

### Core Loop Design — 20%

- Gathering, conversion, preparation, and survival directly depend on one another.

### Focus — 15%

- One field, one shelter, three cycles, and no unfinished side systems.

### Originality — 10%

- Original world, characters, terminology, art, audio, encounter design, and upgrade interactions.
- Genre conventions may be familiar, but no protected characters, copied audiovisual expression, distinctive interfaces, or recognizable franchise substitutes.

## Build compliance

- Prompt-built with AI assistance documented in `BUILD_LOG.md`.
- Single-player and fixed portrait.
- Self-contained HTML5 / Three.js package.
- No runtime network requests.
- Final ZIP under 35 MB.
- Top-level readable, unminified `index.html` contains all original game code.
- Third-party libraries stored locally in `vendor/`.
- All assets, fonts, sounds, and data stored locally and referenced relatively.
