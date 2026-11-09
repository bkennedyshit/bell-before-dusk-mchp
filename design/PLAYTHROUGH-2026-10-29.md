# Android campaign route pass — 2026-10-29

Build: 0.3.0-campaign, code 9, debug APK SHA256
`AD45A6EBCBCF7227FD82BD44FFA6B1466FE496A722F0F81C72E4D31152EF4C47`.
Target: Medium_Phone_API_36.1, Android emulator. No Vercel deployment.

## Method and limits

Native packaged WebView, fresh isolated QA save. A test-only factory wrapper
exposes existing state for observation. Movement, jump, slash, dialogue and gate
handlers drive the normal game loop. No health, location, currency, key, kill or
completion flags are granted. This is an instrumented automated route pass,
not a human playthrough or physical-phone certification. The owner's save is
redirected away from the test slot; final preservation is checked on cleanup.
Commands/results are in `art-review/android-route-2026-10-29/session.jsonl`.

The emulator Android system crashed during the causeway entry session.
Its crash buffer reports `FATAL EXCEPTION IN SYSTEM PROCESS`, AppOps
`Invalid @IntRange(from = -1): -41447`, followed by system-service deaths.
The app was cold-launched and the earned QA save resumed. The run therefore
does not certify an uninterrupted stability session. Crash evidence is saved
beside the route log.

## Player itinerary

1. Post Town north → Cedar Road → northeast TRAILS → Cedar Canopy.
   Climb the middle and upper decks for the road token, then use the far EXIT
   from ground level. Return to Cedar Road, then take its north town gate.
2. Cedar Hamlet: talk to Aya. The upper-left forge sells the blade upgrade;
   Takeshi offers an optional tool errand. Return south through Cedar Road
   to Post Town.
3. Post Town south → Southern High Road → east Flooded Causeway.
   Cross and use its far ground EXIT. Continue down High Road to Willow Ferry.
4. Willow Ferry: speak to Nao; the inn heals and market sells a travel kit.
   Take the south gate into River March, then its west Harvest Trail.
5. Harvest Levee: recover the upper-deck warehouse key and use EXIT.
   Backtrack through Willow Ferry to High Road's west Storehouse entrance.
6. Cross Bandit Storehouse, fight the captain in its tiered room, use EXIT.
   Return north through Post Town and Cedar Road to Cedar Hamlet.
7. Speak to Aya, take the north Broken Ward gate, defeat the guardian during
   its recovery windows, then acknowledge the epilogue and credits.

Optional fifth platformer: Forest Spirit Path from Cedar Road's TRAILS menu.
River March's eastern and coastal roads are closed chapter extensions.

## Findings to address

Follow-up: the two defects below are fixed in 0.3.1, and Cinder Maw is now
implemented with front/left/right art. See `TEST-REPORT-0.3.1.md`; the original
0.3.0 observations and evidence remain below for traceability.

- Story directions currently request a causeway upper-route cargo marker;
  the actual stage has no required relic. Correct the text or deliberately
  implement that objective; do not send players searching for a nonexistent item.
- The requested circular-platform finale needs its own original demon boss.
  The current Bandit Captain does not fulfill that request. See
  `DEMON-BOSS-FOLLOWUP.md`; this is recorded, not implemented.
- The captain room exposes the outdoor blue/forest backdrop below the room's
  drawn floor, behind the lower controls. Its background currently stops at
  world y558 while the viewport extends farther down. Extend the room backing
  to cover the viewport. This is a visual defect, not an extra landing surface.

## Results

**Current campaign completed on Normal in the packaged Android build.**
All five stages are marked cleared from actual traversal: Canopy, Causeway,
Harvest, Storehouse and optional original Spirit Path. Both bosses were defeated
through normal attacks and recovery windows. Captain rush/knives/leap and guardian
charge/ground marks/projectiles ran. Four ending/credits cards were acknowledged.
Victory, equipped longblade, both bosses and errands survive serialization/resume.

Aya and Nao conversations, actual forge/inn/market doorways, earned-mon blade and
health upgrades, free inn healing, both optional errands and all three unlocked
weapons passed. Town travel from Broken Ward was denied; menu travel from Cedar
to Post Town and back succeeded. Attempting both rewards again paid nothing.

The final progress snapshot records about 905 simulated gameplay seconds and two
respawns. Combat remained active during some inspection gaps before idle pause;
the deaths are not evidence of a no-death run or a combat difficulty assessment.
The run used keyboard event input and existing menu handlers in the native
WebView, not touch-only play. The jump controller initially fell on the causeway
before a successful crossing; this alone does not establish a player-facing bug.

`art-review/android-route-2026-10-29/result.json` records fullPlaythrough=true,
no observed page errors after reconnection, and ownerSaveUnchanged=true. The
temporary hooks were removed by cold-restarting the app. The owner's original
journey is back at the normal title screen. The completion belongs to the QA slot.
The first WebView screenshot captures were blank (the Canvas is composited on
Android's surface); those are capture failures, not visual evidence of an ending.
The session log records all ending cards and acknowledgement. A subsequent
native screencap records the restored completed journey in town.

Automated regression checks rerun: 50 baseline campaign, 9 completion, 5 arena.
Also passed: 7 journey features, 6 narrative, billing-gate suite, git diff check.

## Market status

The existing story has a playable ending; this pass found no main-route lock
requiring a granted key or a developer scene jump. It does not certify every
collision, performance across phones, the new demon boss, live billing, final
release signing, rights audit or store listing. Fix the text and room background,
make the requested demon encounter, then test the resulting candidate again.
The build remains local Android only; no Vercel publish or store upload occurred.
