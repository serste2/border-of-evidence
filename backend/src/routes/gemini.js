import express from 'express';
import { validateVisualLayerBreakdown } from '../services/geminiValidator.js';

export const geminiRouter = express.Router();

// Visual layer breakdown for issue #1.
// The frontend should not call Gemini directly in production.
// This backend keeps the Gemini API key server-side and returns typed JSON.
geminiRouter.post('/visual-layer-breakdown', async (req, res, next) => {
  try {
    const result = await validateVisualLayerBreakdown(req.body || {});
    res.json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});
