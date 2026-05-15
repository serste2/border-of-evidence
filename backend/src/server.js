import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { geminiRouter } from './routes/gemini.js';

const app = express();
const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'border-of-evidence-backend',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.use('/api/gemini', geminiRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Border of Evidence backend listening on http://localhost:${port}`);
});
