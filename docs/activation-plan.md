# Activation Plan: Scraper + Codex

This plan turns Border of Evidence from a simulated live map into a controlled data-ingestion prototype.

## Current state

The frontend is live and renders MAP 22 markers from `frontend/src/assets/art/map-elements.v1.json`.

The backend includes:

- Gemini validation service
- Seraphina RSS/news connector
- SSE live pulse endpoint
- manual validation endpoint
- dedupe TTL
- polling controls

## Activation rule

Do not enable automatic polling before the backend has a deployed URL, a valid `GEMINI_API_KEY`, and a controlled feed list.

Polling must remain opt-in through environment variables.

## Environment variables

Backend:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
ALLOWED_ORIGIN=https://border-of-evidence.vercel.app
SERAPHINA_SIMULATION_ENABLED=false
SERAPHINA_NEWS_POLLING_ENABLED=true
SERAPHINA_NEWS_POLL_INTERVAL_MS=300000
SERAPHINA_MAX_ARTICLES_PER_POLL=6
SERAPHINA_MIN_EVIDENCE_SCORE=0.7
SERAPHINA_DEDUPE_TTL_HOURS=48
SERAPHINA_NEWS_FEEDS=https://www.eea.europa.eu/en/newsroom/news.xml,https://www.fao.org/news/rss-feed/en/,https://www.euractiv.com/sections/agriculture-food/feed/,https://www.euractiv.com/sections/energy-environment/feed/
```

Frontend:

```text
VITE_LIVE_EVENTS_URL=https://YOUR-BACKEND-DOMAIN/api/events/live
```

## Test sequence

1. Deploy backend.
2. Open `GET /health`.
3. Open `GET /api/news/status`.
4. Keep `SERAPHINA_NEWS_POLLING_ENABLED=false` for first test.
5. Test manual validation with:

```bash
curl -X POST https://YOUR-BACKEND-DOMAIN/api/news/validate \
  -H "Content-Type: application/json" \
  --data-binary @backend/fixtures/tar-hunting-ruling.json
```

6. Confirm frontend receives SSE pulse.
7. Enable real polling with low limits.
8. Watch `/api/news/status`.

## Codex next tasks

Codex should implement small PRs only:

1. Add a non-invasive live event drawer that stores last 10 validated items.
2. Add status UI for `connected / offline / validating / pulsed`.
3. Add a backend integration test or script for `/api/news/validate`.
4. Add an archive model for validated evidence entries.
5. Add a UI route for archive/forum/community later.

## Seraphina next tasks

Seraphina should ingest and route evidence only. It must never create or modify visuals.

Its output must always route to an existing MAP 22 `element_id`.
