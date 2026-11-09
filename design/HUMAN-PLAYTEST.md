# Bell Before Dusk — final-design playtest sheet, 0.3.0

Status: prepared for human testers; not a completed human playthrough.
Use a fresh tester save/device, not the developer's existing journey. Do not
clear app data on someone else's device. Record phone model, Android version,
build version, approximate FPS/lag, and which input method you used.

## Route to complete

1. Post Town north → Cedar Road → northeast shrine → Cedar Canopy.
   Recover its upper-deck token and use the far ground-level EXIT.
2. Cedar Road north → Cedar Hamlet. Talk to Aya, enter the inn and forge.
3. Return to Post Town → south High Road → east Flooded Causeway. Finish it.
4. High Road south → Willow Ferry. Talk to Nao and visit the inn/market.
5. Willow south → River March → west Harvest Levee. Recover the key and finish.
6. Return to Willow → north High Road → west Bandit Storehouse. Beat the captain,
   then Cinder Maw in the tiered room: climb out of floor fire, change height for
   marked breath, leave the dive mark, and strike during OPEN. Use EXIT afterward.
7. Return to Cedar Hamlet → Aya → north Broken Ward. Beat the guardian.

Optional: Cedar Road's original Forest Spirit Path; original opening from title.
River March's east/coast exits are closed extensions, not the route to victory.

The captain is now in a dedicated six-shelf room after the storehouse approach.
Climb each tier; evade rush, aimed knives and the marked leap; strike during
recovery. Guardian victory opens an epilogue and credits. A new journey has three
intro cards; an existing save keeps its location and progress without replaying them.

## Journey Kit — optional systems

Open JOURNAL → JOURNEY KIT. Every screen must pause movement and damage.

- Accept Shin's missing-tackle errand, replay Forest Spirit Path, return to Shin
  in Cedar Hamlet, and claim the River Tanto plus 8 mon once only.
- Accept Takeshi's tool errand, recover it on Flooded Causeway, and return to
  Cedar Hamlet for the Warden Longblade plus 10 mon once only. Declining the
  errand must still permit trading at the forge.
- Compare Courier Katana / River Tanto / Warden Longblade reach, damage and
  recovery. Selection must persist through relaunch; locked weapons cannot equip.
- Reach Willow Ferry to unlock town travel. Only discovered towns may be selected,
  from a safe town/interior; roads, stages and combat must not permit travel.
- Change Normal ↔ Assist. Incoming damage and warning duration change, but jump
  height, movement, item rewards and stage geometry must not.

This debug APK deliberately unlocks the whole adventure without payment. The
release bundle gates Cedar Hamlet and the southern roads after the free opening.
Do not treat a playtest unlock as proof of billing. Real purchase/cancellation/
pending/restore checks require the configured app on a Google Play test track.

## Checks while playing

- Can you determine the next destination without this sheet? Try every town guide,
  JOURNAL → DIRECTIONS, and MAP. Record any misleading road or locked sign.
- Stand, run and stop in eight directions. Look for floating feet, lateral jumps,
  shifting shadows, oversized bandits, white fragments and scenery clipping.
- Walk over a road label: it should fade rather than hide Yusuke.
- Platform inputs: tap terrain to walk, tap Yusuke to slash, double-tap terrain
  for a short hop, triple-tap for high. Compare with tapping/holding JUMP.
- Try two-finger joystick+jump, stop a tap destination with manual movement,
  pause mid-travel, and walk off a ledge. No stuck movement or repeated jumping.
- Die once, resume, enter/exit interiors, background the app and relaunch it.
  Progress should survive; returning should not put you in an instant death loop.
- Play for 20+ minutes; note slowdown, heat, audio issues, unreadable text or taps
  that need repeated attempts. Emulator performance is not a physical-phone result.

## Report each problem

Build / device / town or stage / input method / steps / expected result /
actual result / screenshot or short clip. Say whether it happened again.

Do not buy anything: this APK has no real-money purchasing. Boss tuning is
intentionally unchanged for this test. No claim of store readiness is made.
