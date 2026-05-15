import express from 'express';

export const eventsRouter = express.Router();

const clients = new Set();

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

function buildPulsePayload(elementId = randomElementId(), overrides = {}) {
  return {
    trigger: 'pulse_reveal',
    element_id: elementId,
    timestamp: new Date().toISOString(),
    source: 'simulated_seraphina_ingestion',
    ...overrides,
  };
}

function writeSse(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function dispatchPulseEvent(payload) {
  const event = buildPulsePayload(payload.element_id, {
    ...payload,
    trigger: 'pulse_reveal',
    timestamp: payload.timestamp || new Date().toISOString(),
  });

  for (const client of clients) {
    writeSse(client, 'pulse', event);
  }

  return event;
}

// Server-Sent Events endpoint for live frontend pulse reveals.
// Simulation can be disabled with SERAPHINA_SIMULATION_ENABLED=false.
eventsRouter.get('/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.flushHeaders?.();
  clients.add(res);

  writeSse(res, 'connected', {
    ok: true,
    service: 'border-of-evidence-live-events',
    connected_clients: clients.size,
    timestamp: new Date().toISOString(),
  });

  let closed = false;
  let timeoutId;
  const heartbeatId = setInterval(() => {
    if (!closed) writeSse(res, 'heartbeat', { timestamp: new Date().toISOString() });
  }, 15000);

  const simulationEnabled = process.env.SERAPHINA_SIMULATION_ENABLED !== 'false';

  const scheduleNextPulse = () => {
    if (!simulationEnabled) return;
    timeoutId = setTimeout(() => {
      if (closed) return;
      writeSse(res, 'pulse', buildPulsePayload());
      scheduleNextPulse();
    }, randomIntervalMs());
  };

  scheduleNextPulse();

  req.on('close', () => {
    closed = true;
    clients.delete(res);
    clearInterval(heartbeatId);
    clearTimeout(timeoutId);
    res.end();
  });
});

// Manual test endpoint for forcing a pulse on a specific element.
eventsRouter.post('/pulse', (req, res) => {
  const elementId = req.body?.element_id || randomElementId();
  const event = dispatchPulseEvent({
    element_id: elementId,
    source: 'manual_test',
    payload: req.body?.payload || null,
  });
  res.json({ ok: true, event, connected_clients: clients.size });
});

export function getConnectedClientCount() {
  return clients.size;
}
