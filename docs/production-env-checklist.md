# Production Environment Checklist

This checklist controls the first public activation of Border of Evidence after the live evidence drawer and Seraphina test path were merged.

## Frontend: Vercel

Set this variable in Vercel Project Settings / Environment Variables:

```text
VITE_LIVE_EVENTS_URL=https://YOUR-BACKEND-DOMAIN/api/events/live
```

The value must use `https://`. Vercel serves the frontend over HTTPS, so a plain `http://` backend will be blocked by the browser as mixed content.

After setting or changing the variable, redeploy the frontend.

## Backend: Express host

Set these variables on the backend hosting provider:

```text
PORT=8787
GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY
GEMINI_MODEL=gemini-1.5-flash
ALLOWED_ORIGIN=https://border-of-evidence.vercel.app

SERAPHINA_SIMULATION_ENABLED=false
SERAPHINA_NEWS_POLLING_ENABLED=false
SERAPHINA_NEWS_POLL_INTERVAL_MS=300000
SERAPHINA_MAX_ARTICLES_PER_POLL=6
SERAPHINA_MIN_EVIDENCE_SCORE=0.7
SERAPHINA_DEDUPE_TTL_HOURS=48
SERAPHINA_NEWS_FEEDS=https://www.eea.europa.eu/en/newsroom/news.xml,https://www.fao.org/news/rss-feed/en/,https://www.euractiv.com/sections/agriculture-food/feed/,https://www.euractiv.com/sections/energy-environment/feed/
```

Use the provider-assigned `PORT` if required. Some hosts inject `PORT` automatically; in that case do not force `8787` unless the provider allows it.

## First production test sequence

1. Keep `SERAPHINA_NEWS_POLLING_ENABLED=false`.
2. Keep `SERAPHINA_SIMULATION_ENABLED=false` unless a visual SSE smoke test is needed.
3. Open the backend health endpoint:

```text
GET https://YOUR-BACKEND-DOMAIN/health
```

Expected: `ok: true` and `geminiConfigured: true`.

4. Open the news status endpoint:

```text
GET https://YOUR-BACKEND-DOMAIN/api/news/status
```

Expected: polling disabled, running false.

5. Open the Vercel frontend and check the footer live status.

Expected: `connected` if `VITE_LIVE_EVENTS_URL` is correct and backend SSE is reachable.

6. In a terminal, run a manual validation request against the public backend:

```bash
curl -X POST https://YOUR-BACKEND-DOMAIN/api/news/validate \
  -H "Content-Type: application/json" \
  --data-binary @backend/fixtures/tar-hunting-ruling.json
```

Expected: Gemini validates the article, dispatches an SSE pulse, and the frontend live evidence drawer receives the event.

## Controlled polling activation

Only after the manual end-to-end test works:

```text
SERAPHINA_NEWS_POLLING_ENABLED=true
SERAPHINA_MAX_ARTICLES_PER_POLL=3
SERAPHINA_MIN_EVIDENCE_SCORE=0.75
```

Watch:

```text
GET /api/news/status
```

If duplicate or weak events appear, raise `SERAPHINA_MIN_EVIDENCE_SCORE` or narrow `SERAPHINA_NEWS_FEEDS`.

## Failure checks

If the frontend says `offline`, check:

- `VITE_LIVE_EVENTS_URL` includes `/api/events/live`
- backend URL uses `https://`
- `ALLOWED_ORIGIN` exactly matches the Vercel URL
- backend process is running
- browser console does not show CORS or mixed-content errors

If `/api/news/validate` fails, check:

- `GEMINI_API_KEY` exists on the backend provider
- `GEMINI_MODEL` is supported
- backend logs for JSON validation errors
- article payload has title, summary/content, source, and URL
