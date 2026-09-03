# Town / Outskirts Revision

## Decision

This is not a miniature open-world Zelda game and it is not a Mystical Ninja remake. It is a **6–8 minute survival-and-resource run presented as one humorous supernatural town incident**.

Working title: **Bell Before Dusk**.

The contest category remains **Survival & Resource Management**. The adventure structure exists to make the required gather, convert, and survive loop easy to understand.

## Working premise

Japan, 1605. A provincial post town's ward bell has been sabotaged just before dusk. A self-important local official blames demons; the hero immediately discovers that ordinary roof bandits stole the bell's clapper for scrap. Recovering it solves only half the problem: the bell must still be repaired and charged before the mountain fog reaches the town gate.

The tone is warm, physical, and lightly absurd. The hero is brave and competent but repeatedly drafted into jobs that should belong to better-funded officials.

## One-session route

### 1. Town street — top-down, 30–45 seconds

- Begin in a clearly safe post-town block.
- A short NPC exchange states the whole objective: **recover the clapper, repair the bell, stop the dusk breach**.
- The hero receives or draws the katana here.
- Town architecture frames the portrait screen: a close foreground roof/parapet at the bottom, navigable street in the center, and repeating facades, eaves, gates, and distant rooflines at the top.
- Ordinary residents are non-hostile. One readable bandit encounter introduces the sword.

### 2. Roof chase — side view, 45–60 seconds

- An explicit ladder, gate, and camera transition lead to the side-view section.
- The objective remains on screen: **Catch the thief carrying the bell clapper**.
- One short authored route uses three moves only: run, jump, slash.
- Human bandits are the only enemies here.
- Recovering the clapper ends the section immediately and returns the player to the bell yard. This section never pretends to be the core resource loop.

### 3. First outskirts run — top-down, 60–90 seconds

- The town gate visibly separates warm safety from a cool cursed road.
- Gather **cedar fiber** from common nodes and **yokai ash** from defeated spirits.
- A fog-pressure meter rises only while outside the gate.
- Staying longer earns more material but spawns stronger pursuit and risks health. Returning early is safe but limits the first repair choice.

### 4. Bell yard — top-down conversion, 20–30 seconds

- Spend both materials at the damaged bell; no separate abstract upgrade screen.
- Choose one visible repair:
  - **Braided ward rope:** fog rises more slowly on the next run.
  - **Tempered clapper:** katana and bell strikes deal more damage.
- The chosen repair visibly changes the bell and the HUD.

### 5. Second outskirts run — top-down, 60–90 seconds

- Resource nodes are farther from the gate.
- A second yokai behavior pressures the return path.
- The player gathers enough material for one final choice:
  - **Gate talismans:** stronger final defense.
  - **Warrior's knot:** more health and faster gathering.

### 6. Final gate breach — top-down, 60–90 seconds

- The fog reaches the gate and the repaired bell becomes the defense objective.
- The player alternates between katana combat and striking/charging the bell.
- The selected repairs materially change the finale.
- Victory: fill the ward resonance meter and banish the gate yokai.
- Defeat: hero health or bell integrity reaches zero.
- Show the two choices, score, and immediate restart.

## Camera and navigation rules

- The build never changes from portrait orientation.
- Town and outskirts use the same elevated top-down camera and controls.
- The only side-view area is the brief roof chase.
- Every camera transition has a physical threshold, a stated destination, and an unchanged objective.
- Mist is environmental language for cursed territory and the final breach, not a timer effect that appears everywhere.

## What is borrowed versus original

Useful genre grammar:

- Town information and services before committed action.
- Architectural layers that frame a street with near and distant roofs.
- A brief shift from elevated town movement to side-view platform action.
- Chunky animation, strong silhouettes, and physical comedy.

Must remain original:

- Hero design and silhouette.
- Town plan, roof route, enemies, boss, dialogue, terminology, music, interface, animation frames, color language, and story.
- No blue-haired red-clad folk hero, smoking pipe weapon, copied HUD, copied screen composition, or franchise-specific jokes.

## Prototype asset ceiling

### Hero

- Four top-down idle facings.
- Two-frame top-down walk for four directions.
- Three-frame katana slash reused by mirroring where safe.
- Side-view idle, run, jump, and slash.
- One hit pose.

### Other characters

- One town official: two talk poses.
- One bandit: run and attack.
- Two yokai silhouettes: move, attack, hit.
- One final gate yokai: idle, attack, hit.

### Environment

- Six modular town facade/eave pieces.
- Two foreground roof/parapet pieces.
- One gate, one bell yard, one ladder transition, and one short roof kit.
- One outskirts ground set, three vegetation/rock clusters, two resource nodes, and one fog overlay.

## Current gray-box changes required

- Remove the unexplained periodic shrine processions.
- Replace shrine integrity with bell integrity/resonance during the finale only.
- Replace the altar-chest opening with a direct town objective and sword onboarding.
- Replace reeds/embers with cedar fiber/yokai ash and show their exact use at the bell.
- Replace the abstract upgrade screen with an in-world bell repair interaction.
- Replace the spirit-road transition with the explicit roof-bandit chase.
- Add objective text that survives camera transitions.
- Separate town human enemies from outskirts yokai by zone and art language.

## Production order

1. Rebuild the gray-box route and objective flow with geometric art.
2. Verify one complete portrait session and category compliance.
3. Lock the hero concept and generate animation frames in small batches.
4. Build modular town facades and roof framing.
5. Replace enemies, resources, bell, and interface assets.
6. Tune, playtest, validate offline, and package.
