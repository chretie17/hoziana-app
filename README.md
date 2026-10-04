# Hoziana Choir — the app

The phone app for Hoziana Choir ADEPR Nyarugenge, for Android and iPhone, built
with Expo (React Native). It has no content of its own: everything comes from
the website's dashboard, so a song, a video, an update or a committee photo
saved there reaches the app and the website together.

## What it does

- **Songbook** — all the songs, searchable by title, key, verse or number.
  Case, accents and the curly apostrophe are ignored, so "ry'isi" finds
  "RY’ISI". Each song has a reading size that is remembered, and the previous
  and next songs at the bottom.
- **Works with no signal** — the whole songbook is built into the app, so it
  opens in church with no internet even the first time. When there is signal,
  the app quietly checks the website for anything new.
- **Recordings** — a song with a recording uploaded in the dashboard plays
  above its words, keeps playing when the phone is locked or another app is
  opened, shows its name and the choir's mark on the lock screen, and stays
  docked under every page while it plays.
- **Listen** — the choir's videos, songs and past live sessions apart, played
  inside the app with YouTube's own player. A live broadcast announced in the
  dashboard appears at the top of Home and Listen.
- **Updates**, **Our story** (history, committee portraits, contact) and a
  choice of Kinyarwanda, English or French. The phone's language is used when
  the app speaks it, Kinyarwanda otherwise.
- **The choir's colours and type** — the six colours set in Dashboard → Colours
  recolour the app on its next check; headings are EB Garamond and text Inter,
  as on the website.

## How the content arrives

The website serves everything at `GET /api/app/content` (see the website's
README, "The app's content"). The app keeps three copies, each replacing the
one before:

1. `assets/content-snapshot.json`, built into the app;
2. the last copy downloaded, saved on the phone;
3. the website's, fetched on opening, on pull-to-refresh, and on coming back
   to the app after ten minutes.

Each download carries an `ETag`; the next check sends it back and gets an
empty "nothing changed" when nothing has, so the songbook is not downloaded
again on a phone plan paid by the megabyte.

The shape of that content is copied in `src/lib/types.ts`. The website only
adds fields to it, and raises `schema` for anything else; a copy of the app
that meets a newer schema keeps what it has and says an update is waiting.

Refresh the built-in songbook before each store release:

```bash
npm run snapshot                          # from the live website
npm run snapshot -- http://localhost:3000 # from a local copy of the website
```

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the camera (iPhone). The app
reads `https://hoziana-choir.vercel.app` unless `EXPO_PUBLIC_SITE_URL` says
otherwise — set it once the choir has its own domain.

`npx expo start --web` opens the same app in a browser, which is how it is
checked during development.

Before calling anything done:

```bash
npx tsc --noEmit
npx eslint .
```

## Releasing

Builds are made by Expo's servers (EAS), so no Mac is needed for the iPhone
version. Profiles are in `eas.json`:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # an APK to install directly
npx eas-cli@latest build --profile production --platform all    # for the stores
npx eas-cli@latest submit --platform android                     # to Google Play
```

Changes to the app's own screens can reach installed phones without a store
review: `npx eas-cli@latest update --channel production`. Anything touching
native code — a new native library, the icon, permissions — needs a new build.

The identifiers are `org.hoziana.choir` on both stores. They cannot be changed
once the app is published.

## Where things are

| | |
|---|---|
| `src/app/(tabs)/` | Home, Songbook, Listen, Updates, Our story |
| `src/app/song/[slug].tsx` | A song: words, recording, reading size |
| `src/app/video/[id].tsx` | A video, with more of the same kind |
| `src/app/update/[slug].tsx` | One update |
| `src/lib/content.tsx` | Fetching, saving and refreshing the content |
| `src/lib/player.tsx` | The one audio player, with lock-screen controls |
| `src/lib/i18n.tsx` | The app's own wording in three languages |
| `src/lib/theme.ts` | Colours mixed from the dashboard's six |
| `scripts/snapshot.mjs` | Refreshes the built-in songbook |
