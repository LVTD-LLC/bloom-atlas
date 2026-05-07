# Bloom Atlas PRD

## Summary

Bloom Atlas helps travelers discover where and when beautiful flowering events happen globally: lavender in Provence, sakura in Japan, tulips in the Netherlands, jacaranda in Pretoria, and more.

## Target users

- Travelers planning seasonal trips.
- Photographers looking for bloom windows.
- Garden/flower enthusiasts.
- People who save visual travel inspiration and want timing/context.

## MVP goals

1. Prove the mobile development and Android publishing pipeline.
2. Validate whether a flower/bloom travel catalog feels compelling on mobile.
3. Keep product surface small enough to ship to Google Play internal testing fast.

## Non-goals for v0.1

- No backend.
- No user login.
- No payments.
- No community reports.
- No push notifications.
- No production-grade annual forecast data.

## v0.1 features

- App home with Bloom Atlas positioning.
- Map-style visual discovery screen.
- Seed bloom catalog across multiple countries/months.
- Month filter.
- Calendar/list view grouped by month.
- Detail card with timing, description, travel note, and source note.
- Saved tab placeholder to shape future planning UX.

## Data model

Each bloom event includes:

- plant/common name
- location/region/country
- latitude/longitude
- best months
- season label
- description
- travel note
- source note

## Future feature candidates

- Real map provider: Google Maps, Mapbox, or Apple/Google native maps.
- Annual live bloom status by source.
- User trip saves.
- Nearby bloom discovery.
- “Bloom soon” feed.
- Push alerts for saved blooms.
- Community photo/status reports.
- Premium routes/calendars.

## Launch criteria for first internal build

- TypeScript passes.
- App starts in Expo.
- Android preview build works through EAS.
- Google Play internal testing upload succeeds.
- At least 10 seed bloom events included.
