# On-Demand Time Window Queries

Border of Evidence does not need a permanently awake backend for the prototype. The backend can wake when a user opens the application and asks the system to aggregate evidence for a selected time window.

## User-facing query model

The user chooses one of these windows:

```text
1 month to today
3 months to today
6 months to today
12 months to today
24 months to today
10 years to today
```

Each query creates a new temporary data-viz arrangement over MAP 22.

The arrangement is not a generic search results page. It is a MAP 22 scene state: validated links, reports, rulings, datasets, and articles are routed to existing `map-elements.v1.json` element IDs, then used to activate, cluster, and annotate the map.

## Backend behavior

1. Receive a query request:

```json
{
  "window": "3m",
  "topics": ["hunting", "water", "agroforestry"],
  "sources": ["rss", "configured_feeds", "future_search_api", "community_archive"]
}
```

2. Convert the window into absolute dates.

3. Collect candidate items from available connectors.

4. Deduplicate candidates before Gemini validation.

5. Validate each candidate with Gemini using the existing MAP 22 routing prompt.

6. Keep only entries with:

```text
relevant=true
evidenceScore >= SERAPHINA_MIN_EVIDENCE_SCORE
valid element_id from map-elements.v1.json
```

7. Return an arrangement payload:

```json
{
  "query_id": "uuid-or-hash",
  "window": "3m",
  "date_range": {
    "from": "YYYY-MM-DD",
    "to": "YYYY-MM-DD"
  },
  "entries": [],
  "element_counts": {},
  "clusters": [],
  "scene_state": {}
}
```

8. Dispatch optional SSE pulses only after the arrangement is ready or when individual entries validate.

## Frontend behavior

The frontend should add a small query control with fixed time-window buttons:

```text
1M / 3M / 6M / 12M / 24M / 10Y
```

When a user selects a window:

1. The frontend calls the backend query endpoint.
2. The backend wakes if sleeping.
3. The frontend shows a validating/loading state.
4. The returned arrangement updates:
   - marker density
   - active elements
   - live evidence drawer
   - side panel summaries
   - archive list

## Free-tier constraint

Because the backend may sleep, the first request can be slow. This is acceptable for the prototype.

The system should avoid permanent polling and prefer user-triggered aggregation.

## Important limitation

RSS feeds usually expose recent items only. They are suitable for 1M, 3M, and sometimes 6M queries. For 12M, 24M, and 10Y windows, the project will need at least one of these:

- a search API
- a stored project archive
- manually curated source lists
- public datasets with date filtering
- community submitted evidence

## Recommended implementation order

1. Add backend endpoint `POST /api/query/arrange`.
2. Support fixed windows: `1m`, `3m`, `6m`, `12m`, `24m`, `10y`.
3. Start with configured RSS feeds only.
4. Return a valid arrangement even if few items are found.
5. Add frontend time-window control.
6. Add arrangement rendering on top of existing MAP 22 markers.
7. Later add persistent storage and deeper search connectors.
