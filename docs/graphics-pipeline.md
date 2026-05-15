# Graphics Pipeline

The project must use only Serena Stelitano's provided MAP 22 image as the visual source of truth unless Serena explicitly provides additional artwork.

## Principle

Do not generate alternative versions of MAP 22. Do not reinterpret, repaint, complete, stylize, simplify, or replace the artwork with synthetic scenery.

AI tools may assist only with:

- visual extraction
- layer breakdown
- coordinate mapping
- element taxonomy
- data-association planning
- hotspot placement
- UI annotation planning
- visual QA against the exact provided MAP 22 image

The final visual system must preserve the exact painterly, stratified, irregular, organic, critical quality of the provided MAP 22 file.

## Source of visual truth

Primary and only visual reference for the current phase:

- `MAP_22.png`, provided by Serena in the working conversation

The frontend should eventually use a MAP-derived asset set extracted from this exact file. The temporary `map-base.svg` is only a technical scaffold and must not be treated as visual direction.

The border between the two worlds is the river inside MAP 22, not a generic CSS line, scale, balance needle, or generated divider.

## Recommended asset structure

```text
frontend/src/assets/art/
  map-base.png                  # exact user-provided MAP 22 base or approved cropped/base state
  layers/
    00-base-terrain.png          # extracted from MAP 22 only
    01-left-earth-body.png       # extracted from MAP 22 only
    02-river-border.png          # extracted from MAP 22 only
    03-right-earth-body.png      # extracted from MAP 22 only
    04-existing-canopy.png       # extracted from MAP 22 only
    05-existing-water-system.png # extracted from MAP 22 only
  manifest.json
  map-elements.seed.json
```

## Gemini workflow

1. Serena provides MAP 22.
2. Gemini analyzes only the provided MAP 22 image.
3. Gemini returns JSON describing elements, coordinates, visual roles, and possible data associations.
4. Serena corrects any wrong visual reading.
5. ChatGPT updates schemas, docs, manifest, and frontend logic.
6. Codex / frontend integrates extracted assets and coordinates.
7. Gemini validates screenshots against the exact MAP 22 reference.

## What Gemini can produce

- JSON extraction of visible elements
- coordinate map
- element list
- proposed data triggers
- suggested crop/layer boundaries
- visual QA comments

## What Gemini must not produce in this phase

- new landscape art
- alternate MAP versions
- invented props
- generated solar panels or drones placed as final art
- synthetic replacements for Serena's drawing
- generic dashboard graphics pretending to be MAP 22

## Frontend rule

The frontend should treat MAP 22 as a target-state evidence map. Elements become active through data, but the visual vocabulary must come from the provided artwork. UI remains an annotation system over the artwork.
