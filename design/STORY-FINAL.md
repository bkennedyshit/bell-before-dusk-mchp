# Bell Before Dusk — final chapter story

Authored 2026-10-27. This is the narrative content contract for the current three-town campaign, not a claim that the game is store-ready. Runtime copy is in `campaign-story.js`; integration and final on-device layout verification belong to the campaign build.

## Premise

Yusuke is a courier entrusted with a ward seal. A gang steals Post Town's bell clapper as a diversion, takes the seal, and redirects provisions into its storehouse. Without the seal, the northern guardian obeys a broken command and attacks travellers. Yusuke must follow the cargo trail, reclaim the seal, and free the guardian so the three towns can trade and travel again.

The main emotional goal is reconnecting people, not adding a revenge plot disconnected from the actual mechanics. The title stays **Bell Before Dusk**. The original clapper chase remains playable and meaningful, but the road chapter's introduction catches up players who start directly in the expanded Android campaign.

## Story progression

1. **Post Town:** the clapper is recovered, but the official reveals the larger robbery. The northern shrine's Canopy token is the first lead. The opening explains JOURNAL and MAP without requiring a keyboard.
2. **Cedar Canopy / Cedar Hamlet:** the road token opens the northern town. Aya identifies the missing seal and points to the gang's southern cargo route. Broken Ward remains locked until the captain is defeated.
3. **Flooded Causeway / Willow Ferry:** the cargo marker leads to Nao. Interrupted food and medicine shipments make the robbery's consequences concrete.
4. **River March / Harvest Levee:** the warehouse key is recovered on the upper route. East and coastal roads remain explicitly outside this chapter; they are never presented as the required next destination.
5. **Bandit Storehouse:** the captain guards the stolen ward seal. His tiered side-view arena is the human climax. Winning reopens the northern confrontation, not an unrelated new region.
6. **Broken Ward:** the guardian is the supernatural finale. The returned seal alone cannot end its broken command; avoid its telegraphed attacks and strike during recovery to calm it.
7. **Resolution:** Yusuke restores the seal, the guardian rests, and provisions move between the three towns. Three short epilogue cards conclude the delivery, followed by credits. Completion remains saved. Optional favors and trail replays remain available.

## Optional content

- Shin's missing tackle in the original Forest Spirit Path gives that optional route a civilian purpose.
- Takeshi's stolen tool in the Causeway links a smith's reward to the cargo trail.
- Neither optional favor is required to recover the seal or finish the chapter.
- Fast travel, if unlocked, reconnects already visited towns. It is a reward for reopening roads, never a way to bypass their first traversal or locked progression.

## Runtime integration contract

`window.BELL_STORY` is immutable and has no DOM, gameplay or save mutation:

- `chapter(progress)`: `canopy`, `south`, `harvest`, `captain`, `ward`, or `restored`.
- `objective(progress)` / `directions(progress)`: current real destination, based on existing clear/captain/guardian flags.
- `npc(person, progress)`: dialogue string or `null` to retain a normal shop/unknown interaction. Optional-quest interaction should run first. Rest dialogue assumes the existing rest handler actually restores health.
- `introduction`: three `{title,text}` cards for a genuinely new expanded journey. Do not display repeatedly when resuming an old save.
- `epilogue`: three `{title,text}` cards after the guardian is first defeated; persist completion before showing cards.
- `credits`: concise attribution copy. This does not substitute for a dependency/license or asset-rights audit.
- `events`: chapter-clear and boss-defeat messages.

Recommended persisted flags: `storyIntroSeen`, `storyEndingSeen`. Old saves must default these safely without erasing items or flags; give completed saves an optional replay of the ending rather than forcing a new fight. A modal card sequence must pause combat, consume taps instead of attacking behind the UI, and offer readable next/finish buttons. Android Back may dismiss or return to the journal but must not erase progress.

## Copy and presentation limits

Story cards are at most 55 words each; dialogue and directions remain compact enough for portrait layouts. End-state NPC responses change for Aya, Nao, the official, Sota, Shin, Mina and Sada. There are no invented production credits, licensed properties, additional towns, or promises of future content. Gameplay inspiration does not import another game's names, art, characters or music.
