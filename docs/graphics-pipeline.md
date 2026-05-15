# Graphics Pipeline

The project can use Gemini to generate and validate visual assets, but the base visual language remains Serena Stelitano's MAP-style artwork.

## Principle

Gemini should not replace Serena's authorship. It should operate as a production assistant for:

- layer breakdown
- asset list generation
- stylistic consistency checks
- placeholder generation
- export planning
- hotspot and coordinate suggestions
- visual QA against the MAP reference

The final visual system must preserve the painterly, stratified, irregular, organic, critical quality defined in `docs/visual-style.md`.

## Source of visual truth

Primary reference:

- Serena's MAP drawing

In the frontend, the temporary `map-reference.svg` should be replaced by a real MAP-derived asset set.

The border between the two worlds is the river, not a generic CSS line. The current artificial border line should become either hidden or converted into a subtle annotation of the river path.

## Recommended asset structure

```text
frontend/src/assets/art/
  map-base.png
  layers/
    00-background.png
    01-extractive-ground.png
    02-river-border.png
    03-regenerative-ground.png
    04-canopy.png
    05-foreground.png
    06-hotspot-guides.png
  generated/
    regen-solar-roof-01.png
    regen-solar-drone-fire-01.png
    regen-solar-drone-air-01.png
    regen-solar-drone-soil-01.png
  manifest.json
```

## Gemini workflow

1. Serena provides MAP reference and any new drawing references.
2. Gemini generates a JSON layer plan.
3. Serena approves, edits, or redraws core elements.
4. Gemini generates secondary graphics or placeholder variants from approved prompts.
5. Assets are exported as transparent PNG or SVG.
6. Codex / frontend integrates the assets using `manifest.json`.
7. Gemini validates screenshots against the reference style.

## What Gemini can create

- temporary graphics
- variations of integrated solar panels
- solar drones for fire / air / soil monitoring
- UI-adjacent icons
- fact-card graphics
- gallery placeholder cards
- environmental props
- hotspot badges

## What should stay Serena-led

- the main MAP base
- the river-border composition
- the emotional structure of the two worlds
- final painterly texture and line quality
- major symbolic elements

## Frontend rule

The frontend should treat graphics as layered assets and read their positions from `manifest.json`. The UI must remain an annotation system over the artwork, not a generic SaaS dashboard.
