# 0.3.0 final-design playtest report — 2026-10-27

## Deliverables

- Debug APK: `dist/android/bell-before-dusk-0.3.0-campaign-debug.apk`
  SHA256 `AD45A6EBCBCF7227FD82BD44FFA6B1466FE496A722F0F81C72E4D31152EF4C47`
- Unsigned preparation AAB: `dist/android/bell-before-dusk-0.3.0-release-unsigned.aab`
  SHA256 `61C253140416BC76D4592B149CF6E86349E65903873464ED64B35B64B2B5F2AD`
- Version code9; current package `com.bellbeforedusk.playtest`. APK installed in
  Medium_Phone_API_36.1 emulator on Android16. Existing campaign slot preserved.
- Archive build-info inspection confirms APK `playtest:true` and AAB
  `playtest:false`. AAB has no signing-certificate entries and is not upload ready.

## Passed evidence

- Fifty baseline campaign checks and nine new integrated completion checks.
- Seven journey-feature, six story, five arena and billing-gate checks.
- Original input boundaries, enemy boundaries, bandit facing, town-crowd and
  seventy-eight legacy pose-registration checks.
- Real-browser scene/asset/input/save/UI tests, including native-equivalent
  arena render, quest/trade fallback, Journey Kit and weapon cards. Source fixtures
  are test-only; no QA global is exported in production.
- Android baseline smoke: touch start, portrait fit, Back/journal, background,
  save/resume, offline reload/cold launch, original opening replay, actual forge
  doorway, River March arrival, no external game/analytics fetch or JS/native crash.
- Android completion smoke: tiered arena asset, native jump, Journey Kit/weapon
  cards, fresh intro acknowledgement and actual native billing bridge rejection
  with a blank licensing key. Temporary fixtures restore the exact prior save.
- Native results: `art-review/android-playtest/smoke-result.json` and
  `completion-smoke-result.json`. Browser screenshots: `art-review/campaign-playtest/`.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities.
- Gradle debug build and release-bundle/lint-vital tasks pass; `git diff --check` passes.

## Explicitly not certified

No complete fresh-save native campaign playthrough, physical-phone performance
measurement, 45–60-minute active native soak, live Google Play payment/restore,
server receipt verification, final asset-rights audit, release signing or store
approval is claimed. This is the candidate for the owner's final game testing,
not a statement that it is ready to charge customers today.

Follow `HUMAN-PLAYTEST.md` for the exact campaign/favors/weapon/travel route and
`RELEASE-CHECKLIST.md` for the remaining acceptance gates. No Vercel deployment.

## Subsequent route evidence — 2026-10-29

The existing campaign has now been completed from a fresh isolated QA save on
the Android emulator with instrumented observation and normal movement/combat
handlers. All five stages, both bosses, both favors, saved ending and town travel
passed. The owner's original save was checked unchanged. The emulator itself
crashed once and the earned test save resumed, so this was not an uninterrupted
stability or touch-only pass. See `PLAYTHROUGH-2026-10-29.md` for defects and limits;
`DEMON-BOSS-FOLLOWUP.md` records the separately requested circular-arena demon.
