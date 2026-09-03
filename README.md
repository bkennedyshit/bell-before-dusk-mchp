# MHCP Game Prototype

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
