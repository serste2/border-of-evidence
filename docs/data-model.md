# Data Model

The app is driven by canonical evidence entries. Every source item must be converted into a shared structure before it can affect the visual scene, archive, quiz, poll, or forum.

## Entry lifecycle

```text
raw
  -> normalized
  -> deduplicated
  -> scored
  -> validation_pending
  -> reviewed
  -> published
  -> archived
```

## Core entry fields

- `id`: stable internal ID
- `source_id`: source adapter ID
- `source_name`: human readable source
- `source_url`: source URL
- `retrieved_at`: ingestion timestamp
- `published_at`: source publication date
- `language`: source language
- `title`: item title
- `summary`: short summary
- `claim_text`: extracted claim, if applicable
- `event_type`: study, retraction, claim, funding_shift, policy_update, field_report, community_upload, overclaim_correction
- `topic`: soil, water, biodiversity, energy, governance, hunting, synthetic_inputs, animal_welfare, supply_chain
- `side_hint`: traditional, regenerative, mixed, neutral
- `evidence_quality`: 0 to 1
- `confidence`: 0 to 1
- `impact_score`: 0 to 1
- `visual_effect`: addition, erosion, transformation, no_effect
- `review_status`: pending, approved, rejected, needs_human_review

## Community material

Community gallery uploads are not treated as scientific proof by default. They enter as `community_witness` or `field_note` and can enrich the visual/community layer without directly changing high-confidence evidence scores.

## Scene updates

The visual landscape is updated through aggregated cluster state, not by every single item. The system should avoid noisy visual mutation. It should accumulate signals by topic, side, quality, and time window.
