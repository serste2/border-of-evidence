# Adapters

Adapters convert selected source feeds into normalized candidate entries.

## Adapter rule

Every adapter must return structured data. It must not publish directly to the scene, forum, archive, or gallery.

## Adapter output

```json
{
  "source_id": "example_source",
  "retrieved_at": "2026-05-15T00:00:00Z",
  "items": []
}
```

## First adapter families

- ClaimReview / fact-check feeds
- scientific metadata and retraction feeds
- policy / regulatory sources
- selected news feeds
- agricultural datasets
- community gallery uploads
- partner field reports
