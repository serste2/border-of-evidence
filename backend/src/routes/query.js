import express from 'express';
import { getEvidenceByTimeRange } from '../services/archiveService.js';

export const queryRouter = express.Router();

queryRouter.get('/archive', async (req, res, next) => {
  try {
    const range = req.query.range || '1_month';
    const arrangement = await getEvidenceByTimeRange(range);
    res.json({ ok: true, ...arrangement });
  } catch (error) {
    next(error);
  }
});

queryRouter.post('/arrange', async (req, res, next) => {
  try {
    const range = req.body?.range || req.body?.window || '1_month';
    const arrangement = await getEvidenceByTimeRange(range);
    res.json({ ok: true, ...arrangement });
  } catch (error) {
    next(error);
  }
});
