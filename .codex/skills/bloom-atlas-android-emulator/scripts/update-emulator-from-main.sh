#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$REPO_ROOT"

AVD_NAME="${AVD_NAME:-Bloom_Atlas_API_35}"
ANDROID_SERIAL="${ANDROID_SERIAL:-emulator-5554}"
UPDATE_FROM_MAIN="${UPDATE_FROM_MAIN:-1}"
CLEAN_PREBUILD="${CLEAN_PREBUILD:-1}"
SCREENSHOT_PATH="${SCREENSHOT_PATH:-/tmp/bloom-atlas-latest-main.png}"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
NODE_22_BIN="${NODE_22_BIN:-$HOME/.nvm/versions/node/v22.20.0/bin}"

if [[ -d "$NODE_22_BIN" ]]; then
  export PATH="$NODE_22_BIN:$PATH"
fi

export ANDROID_HOME
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
export ANDROID_SERIAL

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command git
require_command npm
require_command npx
require_command adb
require_command emulator

if [[ "$UPDATE_FROM_MAIN" == "1" ]]; then
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    echo "Tracked worktree changes exist; commit/stash them or set UPDATE_FROM_MAIN=0." >&2
    git status --short
    exit 1
  fi

  git fetch origin main
  git checkout --detach origin/main
fi

npm install
npm run typecheck
npx expo-doctor

if [[ "$CLEAN_PREBUILD" == "1" ]]; then
  rm -rf android .expo
fi

if ! "$ANDROID_HOME/emulator/emulator" -list-avds | grep -qx "$AVD_NAME"; then
  cat >&2 <<EOF
Missing AVD: $AVD_NAME
Create it with:
  sdkmanager "system-images;android-35;google_apis;arm64-v8a"
  avdmanager create avd -n $AVD_NAME -k "system-images;android-35;google_apis;arm64-v8a" -d pixel_7
EOF
  exit 1
fi

if ! adb devices | awk 'NR > 1 { print $1 }' | grep -qx "$ANDROID_SERIAL"; then
  echo "Starting $AVD_NAME as a headless emulator..."
  nohup "$ANDROID_HOME/emulator/emulator" \
    -avd "$AVD_NAME" \
    -no-window \
    -gpu swiftshader_indirect \
    -no-snapshot-load \
    -netdelay none \
    -netspeed full \
    > /tmp/bloom-atlas-emulator.log 2>&1 &
fi

adb -s "$ANDROID_SERIAL" wait-for-device
until [[ "$(adb -s "$ANDROID_SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; do
  sleep 2
done

if command -v scrcpy >/dev/null 2>&1 && command -v screen >/dev/null 2>&1; then
  if ! pgrep -af "scrcpy -s $ANDROID_SERIAL" >/dev/null 2>&1; then
    screen -dmS bloom-atlas-scrcpy zsh -lc \
      "PATH=\"$ANDROID_HOME/platform-tools:\$PATH\" scrcpy -s \"$ANDROID_SERIAL\" --window-title \"Bloom Atlas Android\" --stay-awake --no-audio > /tmp/bloom-atlas-scrcpy-screen.log 2>&1"
  fi
fi

package_json_snapshot="$(mktemp)"
package_lock_snapshot="$(mktemp)"
cp package.json "$package_json_snapshot"
cp package-lock.json "$package_lock_snapshot"

restore_package_files() {
  cp "$package_json_snapshot" package.json
  cp "$package_lock_snapshot" package-lock.json
  rm -f "$package_json_snapshot" "$package_lock_snapshot"
}

trap restore_package_files EXIT

npx expo prebuild --platform android --no-install
restore_package_files
trap - EXIT

(cd android && ./gradlew assembleRelease)

adb -s "$ANDROID_SERIAL" logcat -c
adb -s "$ANDROID_SERIAL" install -r android/app/build/outputs/apk/release/app-release.apk
adb -s "$ANDROID_SERIAL" shell am start -n com.lvtd.bloomatlas/.MainActivity
sleep 5

app_pid="$(adb -s "$ANDROID_SERIAL" shell pidof com.lvtd.bloomatlas | tr -d '\r')"
if [[ -z "$app_pid" ]]; then
  echo "Bloom Atlas process is not running after launch." >&2
  exit 1
fi

adb -s "$ANDROID_SERIAL" exec-out screencap -p > "$SCREENSHOT_PATH"

if adb -s "$ANDROID_SERIAL" logcat -d --pid="$app_pid" \
  | grep -Eiq 'fatal|exception|crash|API key|MapView|react-native-maps'; then
  echo "Crash-like log output detected for process $app_pid." >&2
  adb -s "$ANDROID_SERIAL" logcat -d --pid="$app_pid" \
    | grep -Ei 'fatal|exception|crash|API key|MapView|react-native-maps' >&2
  exit 1
fi

adb -s "$ANDROID_SERIAL" shell dumpsys window | grep -Ei 'mCurrentFocus|mFocusedApp'
adb -s "$ANDROID_SERIAL" shell dumpsys package com.lvtd.bloomatlas | grep -E 'versionCode|versionName|lastUpdateTime'

echo "Installed latest Bloom Atlas on $ANDROID_SERIAL."
echo "Screenshot: $SCREENSHOT_PATH"
