import express from 'express';
import {
  getNewsPollingStatus,
  pollTerritorialNews,
  startNewsPolling,
  stopNewsPolling,
} from '../services/newsConnector.js';
import { validateNewsArticle } from '../services/geminiValidator.js';
import { dispatchPulseEvent } from './events.js';

export const newsRouter = express.Router();

newsRouter.get('/status', (_req, res) => {
  res.json({ ok: true, status: getNewsPollingStatus() });
});

newsRouter.post('/poll', async (req, res, next) => {
  try {
    const result = await pollTerritorialNews({
      feeds: req.body?.feeds,
      maxArticles: req.body?.maxArticles,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

newsRouter.post('/start', (_req, res) => {
  const started = startNewsPolling();
  res.json({ ok: true, started, status: getNewsPollingStatus() });
});

newsRouter.post('/stop', (_req, res) => {
  const stopped = stopNewsPolling();
  res.json({ ok: true, stopped, status: getNewsPollingStatus() });
});

// Manual validation endpoint: useful for testing a single article or field report without waiting for RSS polling.
newsRouter.post('/validate', async (req, res, next) => {
  try {
    const validation = await validateNewsArticle(req.body || {});

    let event = null;
    const minScore = Number(process.env.SERAPHINA_MIN_EVIDENCE_SCORE || 0.6);

    if (validation.relevant && validation.evidenceScore >= minScore) {
      event = dispatchPulseEvent({
        element_id: validation.element_id,
        source: 'manual_news_validation',
        payload: {
          title: req.body?.title || '',
          url: req.body?.url || '',
          source: req.body?.source || 'manual',
          summary: validation.summary,
          reason: validation.reason,
          evidenceScore: validation.evidenceScore,
          domains: validation.domains,
          trigger_type: validation.trigger_type,
        },
      });
    }

    res.json({ ok: true, validation, event });
  } catch (error) {
    next(error);
  }
});
