# Border of Evidence

**Border of Evidence** is a data-driven, live visual archive for contested agricultural claims, regenerative practices, community evidence, and public learning.

The project combines:

- selected data gathering through Seraphina, the scraper / ingestion layer
- normalized evidence entries and scoring rules
- a live visual landscape that reacts to evidence, not opinion volume alone
- a regenerative museum interface with explorable practices and hotspots
- archive, forum, quiz, poll, gallery, and reward systems
- AI-assisted validation and development workflows using Gemini, Claude / skills, Codex, GitHub, and Vercel

The project is intentionally **not** a generic web crawler and not a simple dashboard. It is a programmable evidence environment: data enters through controlled sources, passes through normalization and validation, and only then updates the visual and community layers.

## Core principle

The left side represents extractive / industrial / agri-hunting systems as a compressed and saturated visual mass. The right side represents regenerative agriculture as an explorable, growing, data-informed living museum.

The app should remain grounded in Serena Stelitano's visual language: painterly, stratified, organic, critical, and expressive, closer to *COSMOGONIA*, *Andrea Grows*, and the uploaded MAP-style drawing than to a generic SaaS dashboard.

## Repository structure

```text
border-of-evidence/
  docs/                  Project documentation
  schemas/               Canonical JSON schemas
  prompts/               Agent and model prompt specifications
  frontend/              Future website / app frontend
  backend/               Future backend, broker, API, jobs
  adapters/              Source adapters and Seraphina ingestion modules
  .github/workflows/     GitHub sanity checks
```

## Current status

This repository currently contains the project architecture, schemas, prompts, and workflow scaffolding. The production app will be built in later iterations.
