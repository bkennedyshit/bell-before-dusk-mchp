# Bell Before Dusk

The original contest adventure now serves as the prologue to a playable
campaign alpha. After defending the bell, continue into two additional towns,
the southern rice-field road, four additional platform levels, and three boss encounters.
Town residents and indoor shopkeepers provide quest dialogue, healing and permanent
upgrades. The journal pauses play, offers retreat, and saves the journey locally;
MAP shows the connected roads, side trails, bosses and progression locks.

The campaign combines the original character art with new hero run cycles,
eight-direction road demons, and distinct ferry-town residents. An offline Android
debug APK is now available; live Play purchase verification is still pending. The existing live
Vercel link below does not include un-deployed local changes.

Run locally with `node tools/serve-game.cjs` and visit
`http://127.0.0.1:4173/`. Run `node tools/build-campaign.cjs` for a standalone
folder containing only the runtime files. The full route, controls, save
behavior and verification notes are in [design/CAMPAIGN-V1.md](design/CAMPAIGN-V1.md).
To try the expansion immediately, visit `http://127.0.0.1:4173/?chapter=roads`.
That entry uses a separate chapter-preview save slot.

Latest playtest pass: ground-level EXIT/RETURN touch buttons leave platformers;
tap JUMP for a short hop, hold for a higher jump, and down + JUMP drops through
elevated decks. Complete panel images and alpha-measured landing spans replace
the broken strip layout. New town doors use Post Town's building artwork and lead
into reused interiors. Shopkeepers open price/confirmation screens: 6 earned mon for permanent
blade damage +1; 4 for maximum health +20. Inns heal for free. Conversations stay
open until tapped. Willow's south gate leads to River March; Harvest Levee is a
side trail off that field and returns there. Its farther coast/east roads remain
explicitly closed; a fourth town is not implemented. The original Forest Spirit
Path is available from Cedar Road's shrine trail selector. PLAY ORIGINAL OPENING
on the title replays the thief introduction/chase without overwriting the journey.
The playtest is fully unlocked. Native purchase/restore code is included, but the
Google Play product, public verification key and live checkout tests are pending.
Reload the local page to use the updated code; existing journey saves are retained.

## Android playtest

Build/install automation is available in `tools/build-android.ps1`. The debug APK
is `dist/android/bell-before-dusk-0.3.0-campaign-debug.apk`. Normal app launch starts
the expanded campaign, not the original prologue. It has been installed
and smoke-tested on an Android 16 emulator using ADB plus WebView debugging:
native touch, portrait display, Back/journal, background/save/resume, causeway
assets, jumping, airplane-mode loading, cold launch and save persistence.
Physical-phone playtesting, final presentation, live billing verification and production signing
remain required before a store release. See [mobile/README.md](mobile/README.md).
The Android shell and generated files are excluded from Vercel deployments.

0.3.0 includes the captain's six-shelf boss room, authored introduction and ending,
three earned weapon styles, two optional errands, discovered-town travel and
Normal/Assist combat. Open JOURNAL → JOURNEY KIT. `tools/build-android.ps1
-ReleaseBundle` produces an unsigned, gated AAB for release preparation—not a
signed upload-ready Play release. See `design/RELEASE-CHECKLIST.md`.

## Archived contest notes

Competition workspace for the Meta Horizon Creator Competition: Game Prototype.

**Live playtest:** https://mhcp-game-prototype.vercel.app/

## Locked constraints

- Single-player
- Fixed portrait orientation
- One complete, replayable session
- One approved genre
- Real-time feedback and in-session progression or escalation
- Self-contained HTML5 / Three.js build with no network requests
- Final ZIP under 35 MB with readable, unminified game code in top-level `index.html`
- Third-party libraries stored in `vendor/`

## Current phase

Playable connected-world prototype implemented in the Survival & Resource Management category. The judge-facing opening now connects a living T-shaped town, a clapper thief escaping through North Gate, an explorable haunted field, one purposeful side-view chase, a walkable return route, and functional inn/forge services. Later North Gate visits reuse the field as the gather-versus-fog survival map before ward repairs and the final bell defense. The contest loop and locked scope are defined in `design/CONTEST-GAME-DEFINITION.md`; the map implementation is documented in `design/WORLD-MAP-V2.md`.

## Run the prototype

From this directory:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/` in a portrait browser window. The game supports touch/mouse or WASD/arrow movement. In top-down areas Space/J attacks and E performs nearby interactions. On the Forest Spirit Path, Space jumps and J attacks. Number keys select repair and forge choices.

## Project structure

- `assets/` — local images, audio, fonts, and data
- `vendor/` — locally bundled third-party libraries
- `design/` — mechanic candidates, scoring, and the selected design
- `BUILD_LOG.md` — required AI-assisted development record

## Finish order

1. Complete repeated fresh-player, start-to-victory phone playtests.
2. Tune combat, fog-front timing, economy, and the final breach from observed runs.
3. Remove any remaining collision or transition blockers.
4. Run the final offline/private-window package validation.
5. Finalize the Design Intent document and submit it with the build log and game ZIP.
# Android 0.3.1 update

Local Android candidate: `dist/android/bell-before-dusk-0.3.1-campaign-debug.apk`.
Cinder Maw is a separate platform boss after the captain. Climb for floor fire,
change height for breath, dodge the marked dive, then attack during OPEN.
Front idle plus left/right action atlases are included offline. Causeway directions
no longer request a nonexistent marker, and the arena backing covers the lower
viewport. See `design/CINDER-MAW.md` and `design/TEST-REPORT-0.3.1.md`.
This update is not deployed to Vercel.
