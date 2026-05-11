# Bloom Atlas

Bloom Atlas is an Android-first, iOS-ready Expo app for discovering beautiful seasonal bloom trips around the world.

The first MVP is intentionally simple: a static seed catalog, a map-like discovery screen, a month calendar, and place detail cards. No accounts, backend, payments, or live bloom reports yet.

## Product direction

Initial user promise:

> Find where and when the world’s most beautiful flowers bloom.

MVP scope:

- Map-style discovery of bloom locations.
- Month/season filters.
- Bloom detail pages with best timing, travel notes, and source notes.
- Seed catalog stored in `src/data/blooms.ts`.
- Android package: `com.lvtd.bloomatlas`.
- iOS bundle ID reserved: `com.lvtd.bloomatlas`.

Deferred until after the mobile pipeline works:

- Real map provider integration.
- User accounts / saved trips.
- Live bloom reports and annual forecast ingestion.
- Push notifications for bloom windows.
- Payments/subscriptions.

## Tech stack

- Expo
- React Native
- TypeScript
- EAS Build-ready config

## Local development

```bash
npm install
npm run typecheck
npm start
```

Run Android locally:

```bash
npm run android
```

Run iOS locally on macOS:

```bash
npm run ios
```

## Local mobile QA instructions for AI agents

Use this section when a local desktop/laptop agent needs to verify that Bloom Atlas still boots and basic navigation works on real mobile runtimes. Prefer running this on Rasul's local machine or another developer machine with Android Studio/Xcode installed instead of trying to host emulators on generic Linux VPS infrastructure.

### Agent operating rules

- Keep checks local and non-destructive. Do not publish builds, submit to stores, rotate credentials, or change EAS/Apple/Google config unless explicitly asked.
- Start with the smallest useful gate: install deps, typecheck, Expo Doctor, then one Android/iOS launch smoke test.
- If a simulator/emulator is already running, reuse it.
- If a command hangs because Metro or the simulator is waiting interactively, capture the visible error/state and stop; do not loop forever.
- Record the exact OS, Node, npm, Expo, Android Studio/Xcode versions in the final QA note when reporting failures.

### Shared prerequisites

1. Use Node.js 20+ or 22+.
2. From the repo root:

   ```bash
   npm install
   npm run typecheck
   npx expo-doctor
   ```

3. Confirm Expo CLI can see the project:

   ```bash
   npx expo --version
   npx expo config --type public
   ```

### Android local runbook

Best host: macOS, Linux bare metal, or Windows with Android Studio. If using Linux, hardware acceleration should expose KVM (`/dev/kvm`). Avoid generic VPS hosts unless they explicitly support nested virtualization; software-only Android emulation is usually too slow/flaky for useful agent QA.

#### One-time Android setup

1. Install Android Studio.
2. In Android Studio, install:
   - Android SDK Platform for a current stable API level.
   - Android SDK Platform-Tools.
   - Android Emulator.
   - A Google APIs or Google Play x86_64/arm64 system image.
3. Create an Android Virtual Device, for example:
   - Pixel 8 or Pixel 7.
   - Recent stable Android API.
   - Hardware acceleration enabled.
4. Ensure CLI tools are on `PATH`. Typical macOS/Linux shell setup:

   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk" # macOS default
   # export ANDROID_HOME="$HOME/Android/Sdk"       # Linux default
   export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
   ```

5. Verify the emulator/tooling:

   ```bash
   adb version
   emulator -list-avds
   adb devices
   ```

On Linux, also verify acceleration:

```bash
test -e /dev/kvm && echo "KVM available" || echo "KVM missing"
egrep -c '(vmx|svm)' /proc/cpuinfo
```

If `/dev/kvm` is missing, report that Android emulator QA is blocked or likely unusably slow on that machine.

#### Android smoke test

1. Start an emulator if one is not already running:

   ```bash
   emulator -avd <AVD_NAME>
   ```

2. Wait until it boots:

   ```bash
   adb wait-for-device
   adb shell getprop sys.boot_completed
   ```

   Expected output after boot: `1`.

3. Launch the app through Expo:

   ```bash
   npm run android
   ```

4. Pass criteria:
   - Metro starts without dependency or bundling errors.
   - The app installs/opens on the emulator.
   - The home/discovery screen renders.
   - Basic tap/scroll interactions do not immediately crash.

5. Useful failure evidence to collect:

   ```bash
   adb devices
   adb logcat -d -t 300
   ```

### iOS local runbook

Hard requirement: iOS Simulator requires macOS with Xcode installed. Do not try to run iOS Simulator on Linux servers or Hetzner-style VPS hosts. For non-macOS environments, report iOS local QA as blocked and use Android only.

#### One-time iOS setup

1. Install Xcode from the Mac App Store or Apple Developer downloads.
2. Open Xcode once and accept/install required components.
3. Install/select command line tools:

   ```bash
   xcode-select --install || true
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

4. Confirm simulator tooling:

   ```bash
   xcodebuild -version
   xcrun simctl list devices available
   ```

5. Boot a recent iPhone simulator if none is running:

   ```bash
   xcrun simctl boot "iPhone 16" || true
   open -a Simulator
   ```

   If `iPhone 16` is not available, choose any available modern iPhone from `xcrun simctl list devices available`.

#### iOS smoke test

1. From the repo root, run:

   ```bash
   npm run ios
   ```

2. Pass criteria:
   - Metro starts without dependency or bundling errors.
   - The app builds/opens in iOS Simulator.
   - The home/discovery screen renders.
   - Basic tap/scroll interactions do not immediately crash.

3. Useful failure evidence to collect:

   ```bash
   xcrun simctl list devices | sed -n '1,80p'
   xcrun simctl spawn booted log stream --style compact --level error
   ```

   Stop the log stream after capturing the relevant error.

### Minimal QA report format

When an AI agent finishes a local mobile check, report:

```text
Bloom Atlas local mobile QA
- Machine/OS:
- Node/npm:
- Expo:
- Android Studio / emulator result: PASS | FAIL | BLOCKED
- iOS Xcode / simulator result: PASS | FAIL | BLOCKED
- Commands run:
- Evidence/screens/errors:
- Recommended next action:
```

## EAS build plan

Install/login to EAS first:

```bash
npm install -g eas-cli
eas login
eas init
```

Then create a preview Android build:

```bash
eas build --platform android --profile preview
```

Production/internal testing build:

```bash
eas build --platform android --profile production
```

Submit to Google Play internal track once Play service credentials are configured:

```bash
eas submit --platform android --profile production
```

## Store setup checklist

Google Play:

- [ ] Create Bloom Atlas app in Play Console.
- [ ] Confirm package name `com.lvtd.bloomatlas`.
- [ ] Enable Play App Signing.
- [ ] Create/attach service account JSON for EAS Submit.
- [ ] Complete Data Safety draft.
- [ ] Add privacy policy URL.
- [ ] Upload first internal testing AAB.

Apple later:

- [ ] Apple Developer Organization enrollment approved.
- [ ] Create app record / bundle ID `com.lvtd.bloomatlas`.
- [ ] Complete App Privacy answers.
- [ ] Wire EAS iOS credentials.

## Notes

This is a starter product repo, not a generic template. If the mobile pipeline works well, we can extract reusable patterns into a separate LVTD mobile starter later.
