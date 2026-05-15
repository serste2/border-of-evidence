import { visualLayerBreakdownPrompt } from '../templates/visualLayerBreakdownPrompt.js';
import { extractJsonObject } from '../utils/extractJson.js';
import { assertVisualLayerPlan } from '../validators/visualLayerPlan.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function validateVisualLayerBreakdown(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured. Add it to backend environment variables.');
    error.status = 500;
    throw error;
  }

  const requestPayload = buildGeminiRequest(payload);
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  const raw = await response.json();

  if (!response.ok) {
    const error = new Error(raw?.error?.message || 'Gemini request failed');
    error.status = response.status;
    error.details = raw;
    throw error;
  }

  const text = raw?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
  const parsed = extractJsonObject(text);
  assertVisualLayerPlan(parsed);

  return {
    ...parsed,
    audit: {
      model,
      validated_at: new Date().toISOString(),
      task_type: 'visual_layer_breakdown',
    },
  };
}

function buildGeminiRequest(payload) {
  const safePayload = {
    task_type: payload.task_type || 'visual_layer_breakdown',
    issue: payload.issue || '#1',
    style_doc_summary: payload.style_doc_summary || '',
    current_site_notes: payload.current_site_notes || '',
    reference_image_notes: payload.reference_image_notes || '',
    constraints: payload.constraints || [
      'Use Serena Stelitano MAP-style visual language.',
      'Return JSON only.',
      'Do not invent final artwork files.',
      'Create an implementation-oriented layer and asset plan.',
    ],
  };

  return {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${visualLayerBreakdownPrompt}\n\nPAYLOAD:\n${JSON.stringify(safePayload, null, 2)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };
}
