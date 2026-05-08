# Google Play Internal Testing Automation

Bloom Atlas Android package: `com.lvtd.bloomatlas`
Expo project: `@lvtd-llc/bloom-atlas`
EAS project id: `fe0513af-8a4a-4ced-8212-1d39c5521826`

## Current release commands

```bash
npm run build:android:play
npm run submit:android:internal
npm run release:android:internal
```

- `build:android:play` builds a production Android App Bundle (`.aab`).
- `submit:android:internal` submits the latest Android build to Google Play internal testing.
- `release:android:internal` builds and auto-submits to Google Play internal testing.

All commands require `EXPO_TOKEN` with access to `lvtd-llc`.

## GitHub Actions

Workflow: `.github/workflows/android-internal-release.yml`

Required repository secret:

- `EXPO_TOKEN` — Expo robot token for `lvtd-llc`.

The workflow can be triggered manually from GitHub Actions. By default it builds a production Android AAB and auto-submits it to Google Play internal testing.

## One-time Google Play API setup

EAS Submit needs a Google Play service account key before non-interactive submit works.

Preferred setup:

1. In Google Cloud, enable **Google Play Android Developer API** for the project connected to the Play Console account.
2. Create a service account, for example `bloom-atlas-play-submit`.
3. Create/download a JSON key for that service account.
4. In Google Play Console, grant the service account access to Bloom Atlas with release-management permissions. Minimum practical permission: manage releases for the app.
5. Upload the JSON key to EAS credentials for `@lvtd-llc/bloom-atlas` → Android → `com.lvtd.bloomatlas` → Service Credentials.

After this, `eas submit --platform android --profile production --latest --non-interactive` and the GitHub Actions workflow should work without manual uploads.

Do not commit service account JSON files. `.gitignore` explicitly excludes likely key filenames.
