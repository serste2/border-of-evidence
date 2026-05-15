import express from 'express';

export const eventsRouter = express.Router();

const pulseElementIds = [
  'infected-water-outflow',
  'left-landslide-infected-water-body',
  'tractor-with-shooter',
  'shot-black-bird',
  'falling-black-bird',
  'black-dog-chained-tree',
  'semi-flooded-field',
  'river-central-axis',
  'water-channeling-hand',
  'wetland-braided-streams',
  'paulownia-flowering-north',
  'paulownia-flowering-south',
];

function randomElementId() {
  return pulseElementIds[Math.floor(Math.random() * pulseElementIds.length)];
}

function randomIntervalMs() {
  return 30000 + Math.floor(Math.random() * 15000);
}

function buildPulsePayload(elementId = randomElementId()) {
  return {
    trigger: 'pulse_reveal',
    element_id: elementId,
    timestamp: new Date().toISOString(),
    source: 'simulated_seraphina_ingestion',
  };
}

function writeSse(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

// Server-Sent Events endpoint for live frontend pulse reveals.
// This is currently a simulation harness for Seraphina/Gemini validated entries.
eventsRouter.get('/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.flushHeaders?.();

  writeSse(res, 'connected', {
    ok: true,
    service: 'border-of-evidence-live-events',
    timestamp: new Date().toISOString(),
  });

  let closed = false;
  let timeoutId;
  const heartbeatId = setInterval(() => {
    if (!closed) writeSse(res, 'heartbeat', { timestamp: new Date().toISOString() });
  }, 15000);

  const scheduleNextPulse = () => {
    timeoutId = setTimeout(() => {
      if (closed) return;
      writeSse(res, 'pulse', buildPulsePayload());
      scheduleNextPulse();
    }, randomIntervalMs());
  };

  scheduleNextPulse();

  req.on('close', () => {
    closed = true;
    clearInterval(heartbeatId);
    clearTimeout(timeoutId);
    res.end();
  });
});

// Manual test endpoint for forcing a pulse on a specific element.
eventsRouter.post('/pulse', (req, res) => {
  const elementId = req.body?.element_id || randomElementId();
  res.json({ ok: true, event: buildPulsePayload(elementId) });
});
