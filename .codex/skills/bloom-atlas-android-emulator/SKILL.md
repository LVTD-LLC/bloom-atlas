---
name: bloom-atlas-android-emulator
description: Bring up or refresh the Bloom Atlas Android emulator, sync latest main, install the release APK, verify startup/map behavior, and keep an interactive scrcpy mirror available. Use when asked to run Bloom Atlas on Android, update the emulator from main, or debug Android startup crashes.
---

# Bloom Atlas Android Emulator

Use this skill for local Android verification of Bloom Atlas. Prefer the release APK path, not Expo Go, because Expo Go previously masked standalone Android map startup failures.

## Fast Path

From the repo root:

```bash
.codex/skills/bloom-atlas-android-emulator/scripts/update-emulator-from-main.sh
```

Useful overrides:

```bash
AVD_NAME=Bloom_Atlas_API_35 ANDROID_SERIAL=emulator-5554 UPDATE_FROM_MAIN=1 CLEAN_PREBUILD=1 \
  .codex/skills/bloom-atlas-android-emulator/scripts/update-emulator-from-main.sh
```

## Local Defaults

- Node: use `/Users/rasul/.nvm/versions/node/v22.20.0/bin` when present.
- Android SDK: `$HOME/Library/Android/sdk`.
- AVD: `Bloom_Atlas_API_35`.
- Device serial: `emulator-5554`.
- Interactive display: headless emulator plus `scrcpy`, because the windowed emulator frontend has exited on this machine.

## One-Time AVD Setup

If the AVD is missing, install/create a Google APIs API 35 arm64 image:

```bash
sdkmanager "system-images;android-35;google_apis;arm64-v8a"
avdmanager create avd \
  -n Bloom_Atlas_API_35 \
  -k "system-images;android-35;google_apis;arm64-v8a" \
  -d pixel_7
```

Use API 35 for this project unless there is a specific reason to change it. API 36 caused avoidable local emulator friction during setup.

## Workflow Notes

1. Start from a clean tracked worktree before syncing to `origin/main`. In Codex worktrees, the local `main` branch may be checked out elsewhere, so testing detached at `origin/main` is normal.
2. Run `npm install` after fetching latest main. Latest app code may add Expo native modules such as `expo-location`.
3. Remove ignored generated native output (`android/`, `.expo/`) before release verification when dependencies or Expo config changed. A stale generated Android project can miss native modules or manifest permissions.
4. Build/install a release APK. Standalone release builds catch problems that Expo Go can miss, including native map provider/API-key failures.
5. After `expo prebuild`, restore accidental `package.json` script rewrites unless they are the intended change.
6. Verify with focused activity, current process id, screenshot, and logcat filtered for crashes.

## Manual Verification Commands

```bash
adb -s emulator-5554 shell dumpsys window | rg -i 'mCurrentFocus|mFocusedApp'
adb -s emulator-5554 shell pidof com.lvtd.bloomatlas
adb -s emulator-5554 exec-out screencap -p > /tmp/bloom-atlas-latest-main.png
adb -s emulator-5554 logcat -d --pid="$(adb -s emulator-5554 shell pidof com.lvtd.bloomatlas | tr -d '\r')" \
  | rg -i 'fatal|exception|crash|API key|MapView|react-native-maps'
```

No output from the final `rg` command is the expected result.
