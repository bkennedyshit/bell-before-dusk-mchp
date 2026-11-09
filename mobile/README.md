# Android playtest wrapper

Separate Capacitor 8 wrapper for the expanded local game. It does not change or
deploy the Vercel demo. The game and its 43 selected runtime assets are copied
into the APK; no local web server or hosted game is required.

## Build

Requirements: Node 22+, Android Studio with JDK 21, Android SDK 36 and build tools.
From the repository root, run:

```powershell
.\tools\build-android.ps1
# Install on one explicitly selected emulator or authorized USB phone:
.\tools\build-android.ps1 -Install -Device emulator-5554
```

Output: `dist/android/bell-before-dusk-0.3.0-campaign-debug.apk`.
The debug package is fully unlocked. `-ReleaseBundle` instead builds
`dist/android/bell-before-dusk-0.3.0-release-unsigned.aab` with the free-opening
gate enabled and no test unlock. Permanent identity and signing remain pending.
Normal launch now defaults to the expanded road campaign, with a visible Android
edition/version label. It does not require a special query parameter. Its save
slot is `bell-before-dusk.campaign.v1.android-campaign`; the initial APK's legacy
prologue save is preserved separately but is not resumed by this edition.
PLAY ORIGINAL OPENING on the title replays the introduction and original chase
without overwriting the active journey. Cedar Road's shrine selector also offers
the original Forest Spirit Path. MAP explains the north/south progression.
Completing that opening now returns to Post Town while retaining previous gear
and route clears; it never teleports to the old save location. JOURNAL's
DIRECTIONS / CONTROLS gives the next unlocked lead. Space, W or Up jump in stages;
release early for a short hop and hold for height. A/D or Left/Right move, S/Down
plus jump drops through a deck, J slashes, and E uses nearby gates.
In platformers, tap terrain to walk horizontally toward it, double-tap for a
short hop and triple-tap for a high jump. Tap Yusuke himself to slash. A double
tap resolves after a 260ms window so a third tap can choose the high jump;
joystick and press/hold JUMP remain the immediate alternative. Manual movement,
pausing, backgrounding and transitions cancel tap destinations.
Package ID `com.bellbeforedusk.playtest` is deliberately a test identity, not an
approved permanent store identity. This is a debug-signed APK, not a paid or
production-ready Google Play release. Native one-time purchase/restoration code
is included with local RSA receipt verification, but its public licensing key is
intentionally blank. The Play product and live purchase tests remain pending.
Release signing is unconfigured. Never share a signing key or commit one.

## Debugging

ADB can install, launch, send touch/Back/Home actions, take screenshots and collect
logs. Debug APKs enable WebView DevTools; release builds leave it disabled. Forward
the app's `webview_devtools_remote_<pid>` socket to a **local** port to connect
Chrome DevTools or Playwright CDP. Do not expose ADB or the debug port publicly.
USB phones require Developer options, USB debugging and the owner's RSA approval.
No root, Android Studio UI automation or MCP server is needed.

Android Back opens/closes the journal in play; Back on title leaves the activity.
Backgrounding clears input, saves, pauses play and stops audio. On return the
journal remains open so the player can deliberately resume. Browser saves do not
automatically transfer into Android's separate app storage.

App label/icon remain playtest presentation; final launcher/store assets, physical
phone/performance testing and Play Console setup are separate release work.

## Automated verification

`node tests/android-smoke.cjs` from the repository root connects to the explicitly
selected `BELL_ANDROID_SERIAL` (default `emulator-5554`) using Playwright's Android
WebView adapter plus native ADB taps/keys/screenshots. It uses the separate
Android-campaign save slot and restores its prior value; it never clears app data.
Playwright must be available in Node's dependency search path (the local Codex
runtime is supported as a fallback). The test briefly toggles airplane mode only
on an emulator, restoring its prior setting. Reports and screenshots are in
`art-review/android-playtest/`. It does not contact testers or publish anything.

The Android 16 emulator smoke run passed on 2026-10-19, including a force-stop /
cold launch with saved data retained, while offline. APK signature verification
also passed. This is not evidence of a complete physical-device playthrough.

`npm audit --omit=dev` reports zero production dependency vulnerabilities at setup.
The CLI's optional iOS tooling currently reports a moderate uuid/xcode dependency
advisory; that Node build tooling is not bundled in the Android APK.
