import { visualLayerBreakdownPrompt } from '../templates/visualLayerBreakdownPrompt.js';
import { newsValidationPrompt } from '../templates/newsValidationPrompt.js';
import { extractJsonObject } from '../utils/extractJson.js';
import { assertVisualLayerPlan } from '../validators/visualLayerPlan.js';
import { assertNewsValidation } from '../validators/newsValidation.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function validateVisualLayerBreakdown(payload) {
  const raw = await callGeminiJson({
    prompt: visualLayerBreakdownPrompt,
    payload: buildVisualLayerPayload(payload),
  });

  assertVisualLayerPlan(raw);

  return {
    ...raw,
    audit: {
      model: getGeminiModel(),
      validated_at: new Date().toISOString(),
      task_type: 'visual_layer_breakdown',
    },
  };
}

export async function validateNewsArticle(payload) {
  const safePayload = {
    title: payload.title || '',
    summary: payload.summary || '',
    content: payload.content || '',
    url: payload.url || '',
    published_at: payload.published_at || null,
    source: payload.source || 'unknown',
  };

  const raw = await callGeminiJson({
    prompt: newsValidationPrompt,
    payload: safePayload,
  });

  assertNewsValidation(raw);

  return {
    ...raw,
    audit: {
      model: getGeminiModel(),
      validated_at: new Date().toISOString(),
      task_type: 'news_validation',
    },
  };
}

async function callGeminiJson({ prompt, payload }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured. Add it to backend environment variables.');
    error.status = 500;
    throw error;
  }

  const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${prompt}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  const raw = await response.json();

  if (!response.ok) {
    const error = new Error(raw?.error?.message || 'Gemini request failed');
    error.status = response.status;
    error.details = raw;
    throw error;
  }

  const text = raw?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
  return extractJsonObject(text);
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
}

function buildVisualLayerPayload(payload) {
  return {
    task_type: payload.task_type || 'visual_layer_breakdown',
    issue: payload.issue || '#1',
    style_doc_summary: payload.style_doc_summary || '',
    current_site_notes: payload.current_site_notes || '',
    reference_image_notes: payload.reference_image_notes || '',
    constraints: payload.constraints || [
      'Use only the provided MAP 22 visual source of truth.',
      'Return JSON only.',
      'Do not invent final artwork files.',
      'Create an implementation-oriented layer and asset plan.',
    ],
  };
}
