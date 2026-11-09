# Android release gates — Bell Before Dusk

Working checklist, 2026-10-27. **Not a store-readiness certificate.** No Vercel deployment is part of the expanded game's release workflow. Recruitment is outside this checklist.

## Current evidence and its limits

- The previous packaged baseline is Android 0.2.5-campaign, version code 8, application ID `com.bellbeforedusk.playtest`.
- The baseline has 50 campaign regression checks, real-browser checks and targeted Android emulator verification of touch movement and timing. New feature work must rerun and extend those tests; prior results do not certify a changed build.
- Automated scene loading, scripted flag transitions and a simulated soak are **not** a fresh-save end-to-end native playthrough or a physical-phone performance result.
- The application ID and launcher presentation are still playtest identities. Previous APKs are debug-signed. A production signing choice and full Play listing are not complete.
- 0.3.0 adds native Play purchase/restore code, local signature checks and a release-only content gate. Public licensing key/product setup and real checkout/restore verification are still pending; this is not a production-verified payment system. Earned mon and in-game weapon unlocks are not purchases with real money.

## 0.3.0 implementation evidence

Authored introduction, progression dialogue, guardian epilogue/credits, six-shelf
captain room, three weapon profiles, two explicit optional errands, discovered-town
travel and Normal/Assist are integrated. Existing saves keep schema1 and gain safe
defaults. Module tests, nine campaign integration checks, the fifty baseline checks
and the real-browser suite exercise these systems. The Android16 baseline smoke and
completion smoke cover lifecycle/offline loading, native arena assets/jump, Journey
Kit/weapon cards, fresh intro acknowledgement and missing-key billing rejection.
Native fixtures restore the exact prior save. This is NOT either required complete
fresh-save native run, a physical-phone result, or a real purchase result.

Debug APK and unsigned release AAB build separately: test flag is true only in the
debug staging; release flag is false. The AAB is not signed or configured for upload.

## Gate 1 — complete and consistent game

2026-10-29 update: the existing 0.3.0 campaign was completed through normal
movement/combat on the native emulator, including all five stages, both bosses,
both favors and saved ending. See `PLAYTHROUGH-2026-10-29.md`. The run used
instrumented observation/keyboard events, resumed after an emulator system-service
crash, and does not satisfy the touch-only or uninterrupted soak gates. The new
demon boss remains a recorded request, separate from the existing captain.

- [ ] New journey has a short introduction that explains the theft, goal and first lead.
- [ ] Main route can be completed without developer shortcuts or outside instructions.
- [ ] Every required token, key, gate, NPC instruction and return destination agrees.
- [ ] Five platform levels remain reachable and return to the correct fields.
- [ ] Captain's tiered arena has reachable low/mid/high ledges, clear attack warnings and safe recovery windows.
- [ ] Guardian has a readable finale, saved completion, epilogue and credits.
- [ ] Weapons have visible trade-offs and saved selection; no accidental double rewards.
- [ ] Optional quests can be accepted, recovered and claimed exactly once; declining/ignoring them never blocks the story.
- [ ] Fast travel only offers eligible discovered towns, never bypasses locks, and cannot open during combat.
- [ ] Normal is balanced; Assist modifies damage/warnings but not jump geometry or traversal rules.
- [ ] Old schema-1 saves migrate without progress loss, including saves already at the ending.

## Gate 2 — native functional pass

Use a separate QA save/device and preserve the owner's journey. Record exact build, device, Android/WebView version and every result.

- [ ] Fresh-save complete main route, all three boss encounters and ending using touch controls only.
- [ ] Second complete run of the same final candidate, including optional Spirit Path and original opening replay.
- [ ] Eight-direction movement/start/stop/attack, diagonal turns and tiny-frame timing regression.
- [ ] Two-finger joystick+jump/slash; finger cancellation, rapid taps, double/triple taps and controls near screen edges.
- [ ] Every platform landing/drop-through/ledge, wall, water edge, cemetery, boat, gate and building boundary.
- [ ] Death/retry in each environment; no instant-death loop or missing checkpoint.
- [ ] All inns, shops, quest rewards, weapon swaps and travel choices; insufficient currency handled without loss.
- [ ] Pause and Android Back consume input; no combat behind tool cards, shop or ending panels.
- [ ] Save/reload at chapter clears, quest acceptance/recovery/claim, purchases, fast travel and victory.

## Gate 3 — lifecycle and performance

- [ ] Background/foreground, lock/unlock, Home/Back, force-stop and cold start preserve appropriate saved state.
- [ ] Offline cold start loads every required asset and audio track; no localhost development server needed.
- [ ] Update-install over a previous build retains the same saved journey.
- [ ] 45–60-minute active play session records frame timing, memory, audio and responsiveness; no growing slowdown or leak.
- [ ] Screen-size/aspect-ratio and refresh-rate matrix, including narrow phone layouts and devices with cutouts/system bars.
- [ ] Physical-phone performance and controls checked independently of emulator results.
- [ ] Accessibility/readability pass: contrast, useful text size, touch targets, clear cues without relying on color alone.
- [ ] No known crash, ANR, save loss, progression blocker or stuck control remains.

## Gate 4 — store package and user decisions

These require explicit product/account decisions; do not silently invent them:

- [ ] Final title, developer identity and permanent application ID approved.
- [x] Monetization design selected: free opening plus a one-time full-game unlock. Testing builds expose all content so the campaign can be verified; that is not a verified paid entitlement.
- [ ] Implement/configure the real Google Play full-game product and verify purchase, cancellation, pending payment, already-owned, acknowledgement and restoration flows before release. Product ID, store configuration and release signatures still require external configuration; no mock success may become a paid entitlement.
- [ ] Release signing/upload-key storage and recovery plan approved; keys kept outside source control.
- [ ] Signed release Android App Bundle built with debugging disabled, audited permissions/dependencies and the current store-required target SDK.
- [ ] Exact release artifact receives a smoke test; debug-APK results alone do not count.
- [ ] Asset/audio/font/dependency rights and credits verified. Generated imagery is not a substitute for checking references and third-party assets.
- [ ] Final launcher icon, feature graphic, screenshots, description, support contact and privacy-policy URL prepared.
- [ ] Content rating, target audience, ads declaration, app access instructions and Data safety answers match the actual app and SDKs.
- [ ] Play Console pre-launch report reviewed; unexplored gameplay still requires our own functional pass.
- [ ] Required account verification/release-track steps completed in the owner's console. Nothing published or paid without the owner's authority.

## Evidence record

For every release candidate retain: version code/name, source revision or archive, artifact hash, test commands/results, device matrix, defect list and remaining limitations. A checkbox is complete only with evidence from that exact candidate or a documented unchanged component—not because the feature exists in code.

Official references to recheck at upload time:

- Android release preparation: https://developer.android.com/studio/publish/preparing
- App signing: https://developer.android.com/studio/publish/app-signing
- Play pre-launch reports: https://support.google.com/googleplay/android-developer/answer/9842757
- App content: https://support.google.com/googleplay/android-developer/answer/9859455
- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469

These links identify the console work to verify; this document does not assert that every future policy requirement has been satisfied.
