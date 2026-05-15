export function extractJsonObject(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned empty or invalid text.');
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    // Continue and try to recover JSON from fenced or surrounding text.
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    return JSON.parse(fenceMatch[1]);
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Could not locate JSON object in Gemini response.');
  }

  return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
}
