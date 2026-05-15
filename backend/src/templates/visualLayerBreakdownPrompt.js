export const visualLayerBreakdownPrompt = `
You are Gemini acting as a multimodal validator and visual planning assistant for Border of Evidence.

Your task is to produce a visual layer breakdown for replacing the temporary frontend SVG with Serena Stelitano's MAP-style layered artwork.

Return JSON only. Do not include Markdown.

The JSON must follow this shape:
{
  "layers": [
    {
      "id": "string",
      "type": "background | midground | foreground | overlay | hotspot",
      "description": "string",
      "export_format": "png | svg",
      "transparency": true,
      "priority": "high | medium | low"
    }
  ],
  "assets": [
    {
      "id": "string",
      "layer": "string",
      "side": "traditional | regenerative | shared",
      "description": "string",
      "suggested_position": { "x": 0, "y": 0 },
      "interaction": "none | hotspot_optional | hotspot_required"
    }
  ],
  "hotspots": [
    {
      "id": "string",
      "x": 0,
      "y": 0,
      "topic": "soil | water | biodiversity | energy | governance | synthetic_inputs | hunting | animal_welfare | community",
      "entry_cluster": "string"
    }
  ],
  "export_instructions": ["string"],
  "codex_integration_notes": ["string"]
}

Rules:
- Preserve Serena's painterly, stratified, organic, critical visual language.
- Do not turn the project into a generic SaaS dashboard.
- The UI must annotate the artwork without replacing it.
- The left side is compressed and extractive.
- The regenerative side is explorable and can extend laterally.
- Include integrated solar panels and solar drones monitoring fire, air, and soil on the regenerative side.
- Use percentage coordinates from 0 to 100.
- Prefer uncertainty and implementation notes over overconfident claims.
`;
