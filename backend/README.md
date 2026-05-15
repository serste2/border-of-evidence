# Backend

The backend is the broker, API, and job layer for Border of Evidence.

## Responsibilities

- source registry
- Seraphina ingestion jobs
- normalization and deduplication
- scoring and classification
- Gemini validation jobs
- human review queue
- scene-state generation
- archive indexing
- forum, poll, quiz, and gallery APIs
- audit logs

## Suggested stack

- FastAPI or Node / Hono / Express
- Postgres
- object storage for media
- queue or scheduled jobs
- API auth and role-based moderation

GitHub is the source of truth for code and documentation. Production runtime should live outside GitHub.
