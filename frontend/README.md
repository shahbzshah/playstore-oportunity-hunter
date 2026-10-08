# Opportunity Hunter — Frontend (Phase 3)

React + Vite single-page app for the Play Store Opportunity Hunter.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # then set VITE_API_URL to your Laravel API base
npm run dev
```

The dev server runs on http://localhost:5173 by default.

`VITE_API_URL` must point at the Laravel API, e.g.
`http://localhost:8000/api/v1` (no trailing slash).

## What it does

- **Auth** — register, login, logout (Sanctum token stored in localStorage).
- **Dashboard**
  - Scan form: enter a Play Store keyword, the backend queues a scan and
    polls its status every few seconds; the opportunity list refreshes when
    a scan completes.
  - Opportunities ranked by score, with title search, bookmark-only filter,
    pagination, and one-tap bookmarking.
- **Opportunity detail** — score breakdown, Play Store link, bookmark,
  delete, and on-demand AI analysis rendered as summary / strengths /
  weaknesses / opportunity / build plan / monetization.

## Build

```bash
npm run build   # outputs to dist/
```
