# Architecture

Border of Evidence is structured as a modular evidence system.

## 1. Seraphina ingestion layer

Seraphina gathers selected data from approved sources only. The system should not perform indiscriminate crawling. Sources may include:

- fact-check feeds and ClaimReview-compatible sources
- scientific metadata and retraction sources
- agricultural datasets
- policy and regulatory feeds
- selected news feeds
- community gallery submissions
- field reports and curated partner inputs

Each source adapter must return normalized raw items with enough metadata for auditability.

## 2. Broker / router

The broker receives normalized raw items and decides which downstream jobs are needed:

- deduplication
- scoring
- classification
- Gemini validation
- human review
- archive indexing
- scene-state update
- forum or gallery routing

Models do not talk to each other freely. The broker sends each model a structured payload and stores every response.

## 3. Validation layer

Gemini is used as a validator for multimodal and document-aware tasks:

- classify uncertain claims
- review source excerpts
- compare screenshots and mockups
- validate gallery images as community witness material
- flag items that require human review

Gemini responses must return typed JSON, not freeform prose.

## 4. Scene-state engine

The scene-state engine translates evidence entries into visual effects:

- addition: new object, cluster, hotspot, or entry
- erosion: weakening, cracking, correction, or reduced weight
- transformation: conversion from one state to another

The bottom pivot remains fixed. The top border can shift within a constrained normalized range. The regenerative side can extend into a lateral museum.

## 5. Frontend

The frontend contains:

- split evidence landscape
- regenerative museum / lateral exploration
- evidence cards and drawers
- live feed ticker
- archive browser
- forum
- quiz
- polls
- community gallery
- rewards and downloadable cards

The frontend must separate illustrated world assets from UI overlays.

## 6. Storage

Use persistent storage outside GitHub for production:

- relational database for entries, users, polls, quizzes, forum threads
- object storage for images, uploads, screenshots, and generated assets
- GitHub for code, docs, schemas, and workflow definitions

## 7. Deployment

Suggested path:

- GitHub: source of truth
- Vercel: frontend deployment
- Supabase / Railway / Render / Fly.io: backend and database
- GitHub Actions: sanity checks and scheduled lightweight jobs
