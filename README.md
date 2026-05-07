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
