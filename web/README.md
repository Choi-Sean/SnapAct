# Snapsist — Marketing site

Next.js (App Router) landing page for Snapsist. English/Korean via a client-side
toggle in the top nav (persisted to `localStorage`, defaults to browser language).

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

This lives inside a monorepo alongside `mobile/` and `backend/`. When importing
the repo into Vercel, set **Project Settings → General → Root Directory** to
`web`. Vercel will only build/deploy this folder — `mobile` and `backend` are
ignored entirely. No other config needed; Next.js is auto-detected.

## Before going live

- `lib/config.ts` — swap `TESTFLIGHT_URL` for the real public TestFlight join
  link once one exists (App Store Connect → TestFlight → Public Link).
- Hero/section copy lives in `lib/i18n/dictionaries.ts` — edit `en` and `ko`
  in the same place so they stay in sync.
