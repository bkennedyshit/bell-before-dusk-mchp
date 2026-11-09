# Android 0.3.1 — Cinder Maw candidate, 2026-10-29

Version 0.3.1-campaign, code 10, com.bellbeforedusk.playtest. Local only.

## Artifacts

- dist/android/bell-before-dusk-0.3.1-campaign-debug.apk — 104097918 bytes,
  SHA256 `5DE36A56F85959CB11586F773BCDFC35A6F111186FF5D865A59A459845F38167`.
- dist/android/bell-before-dusk-0.3.1-release-unsigned.aab — 101126323 bytes,
  SHA256 `9E2E13D3D545F1871C54D91FA8365A777A3A32AF2A0C20348141C75237AD1338`.
- Debug APK built and update-installed in Medium_Phone_API_36.1. Release bundle
  is preparation output, not signed/configured for store upload. Android staging
  includes 46 local art assets and all three new boss PNGs.

## Fixed and implemented

Causeway objective no longer requests a nonexistent cargo marker. Captain-room
backing fills the entire moving viewport, including below the decorative floor.
Original Cinder Maw follows the human captain; its sustained floor fire, marked
height breath and real-surface dive use the platform layout. Saved captain and
demon progress, return directions, ward lock and exit agree. A captain victory
alone cannot skip the demon. Completed older guardian saves remain completed.

12 left-facing action poses, an exact mirrored right-facing atlas in a separate
file, and a separately generated front-facing neutral pose are wired into play.
The mirror utility compares every RGBA pixel. Front is idle/entrance; attacks turn
toward Yusuke. Fixed scale and foot registrations avoid animated size changes.

## Verification

- 50 baseline campaign, 9 completion, 5 arena, 9 demon, 7 narrative, 7 journey
  checks plus billing gates passed during this implementation.
- Real-browser suite passed all scene/asset/input/save/UI checks; new checks
  render front/right sprites and all attack states, and sample the room backing
  independently of the intentional screen vignette. Images are in
  art-review/campaign-playtest/cinder-maw-*.png.
- Corrected an actual native render failure: demon breath warning was reaching
  captain-only target drawing. Added regression coverage for every attack's draw
  path; the subsequent native encounter had no observed page errors.
- Native focused fight on the corrected 0.3.1 candidate: normal 100-HP starting
  hero, katana damage 2, captain-defeated arena fixture. Scripted movement climbed
  to avoid floor fire, changed height for breath, dodged the dive, and dealt all
  42 damage through recovery windows. Won with 100 HP, no respawns. Exit returned
  to Southern High Road; save/resume retained captain/demon flags and stage clear;
  ward gate unlocked. Exact owner save unchanged. Evidence:
  art-review/android-demon-0.3.1-final/session.jsonl and result.json.
- Exact final APK subsequently rerun: installed package SHA256 matches the debug
  artifact above. Deliberately standing through the floor fire reduced HP from
  100 to 72. Scripted movement then avoided the three attacks and defeated the
  boss with 72 HP, no respawns. Exit, stored captain/demon flags, stage clear and
  unlocked ward gate passed after serialization/resume. No observed page errors;
  owner save checked unchanged. Evidence: art-review/android-demon-0.3.1-reverify/.
  Added an explicit death/retry regression: full health, invulnerability, correct
  arena marker and no repeated captain. All nine demon checks pass.
- Final APK baseline native smoke passed touch launch, portrait, Android Back,
  save/resume, jump, actual shop/field entry, offline reload/cold launch and no
  external requests or observed JS/native crashes. Debug/release Gradle builds,
  release lint and git diff --check passed.

## Limits

This is a focused encounter/native regression pass, not a fresh-save full campaign
playthrough of 0.3.1, touch-only acceptance, physical-phone performance measurement,
uninterrupted soak, final balance approval or live purchase verification. The earlier
0.3.0 campaign route report remains separate. Live billing configuration, signing,
rights/listing review and final owner testing are still pending. Nothing deployed
to Vercel, uploaded to Google Play or charged.

Design/research: CINDER-MAW.md. Exact generated-art prompts and mirror provenance:
../art-review/cinder-maw-2026-10-29.md. Built-in image_gen used; original generated
files are retained and production copies live under assets/characters/.
