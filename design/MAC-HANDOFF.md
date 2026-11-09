# Windows → Mac source handoff, 2026-11-09

Repository: https://github.com/bkennedyshit/bell-before-dusk-mchp, branch main.
Game version: 0.3.1. The last shared commit before this handoff was c53b174
(2026-10-12). All later campaign/mobile/assets work was local and uncommitted;
neither the Windows HEAD nor the remote main contained those files. No later
commit/push appears in this checkout's reflog, so the earlier push discrepancy
is missing commits here, not a different remote or a divergent branch.

## Included and checked

The full campaign modules, Cinder Maw/front/left/right art, all required field,
town, platform, character and UI assets, concept/provenance sources, Android
wrapper/Gradle wrapper, package lock, build tools, tests and design documentation.
No asset exceeds 10 MiB. These are normal Git blobs, not external LFS pointers.
Generated APK/AAB output, node_modules, native build caches, local SDK paths,
device saves/logs/captures and private signing material are excluded.

Before committing, tools/audit-transfer.cjs verifies every required web asset and
script exists in the Git index, checks version 0.3.1, scans text for common secret
markers, rejects generated/private files and checks individual file sizes.
tools/build-campaign.cjs now copies all four campaign modules and new boss assets;
its standalone output has 51 files, including 46 runtime asset files (~89 MiB).

Git-triggered automatic deployment is disabled by vercel.json. Preserve that
setting when merging the Mac work. Documentation:
https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments

## Preserve the Mac's existing work

Mac checkout: /Users/williamkennedy/Documents/ChatGPT/mchp. It reportedly has new,
uncommitted Capacitor 8.6 iOS scaffolding. Back up/stash that work including
untracked files BEFORE pulling main. Do not reset/clean it or blindly overwrite
the new Windows mobile/ directory. Reapply the iOS scaffold selectively and merge
package/config changes. Windows is pinned to Capacitor core/android/CLI 8.5.3;
align native packages deliberately if keeping the Mac's 8.6 scaffold. No iOS
scaffold from the Mac was changed by this Windows handoff.

## Browser phone test without USB

From the repository root on the Mac (Node installed):

```sh
BELL_HOST=0.0.0.0 BELL_PORT=4173 node tools/serve-game.cjs
```

Open http://MAC-LAN-IP:4173/?chapter=roads on the iPhone while both devices use
the same local network. Use the actual Mac LAN address, not 127.0.0.1 on the phone.
The chapter=roads parameter selects the expanded campaign and its separate save.
The server binds loopback by default; BELL_HOST explicitly enables LAN testing.
Keep it running during the phone test. A browser reload may be needed to replace
the old prototype. Source HTML has bell-build 0.3.1-local.

The installed iOS app still needs the Mac scaffold integrated with shared staging
and Apple-specific native services; Android Play Billing is not an iOS purchase
implementation. Gameplay/art is one shared source. The game test itinerary is in
OWNER-TEST-0.3.1.md. Separate weapon artwork remains unfinished; three gameplay
weapon profiles are implemented.
