import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Archive, ExternalLink, Leaf, ShieldAlert, Trees, Waves } from 'lucide-react';
import './styles.css';
import entries from './mock/entries.json';
import sceneState from './mock/scene-state.json';
import artManifest from './assets/art/manifest.json';
import mapElements from './assets/art/map-elements.v1.json';

const statusOrder = {
  seed: 1,
  emerging: 2,
  active: 3,
  dense: 4,
  corrected: 5,
  archived: 6,
};

const liveEventsUrl = import.meta.env.VITE_LIVE_EVENTS_URL || 'http://localhost:8787/api/events/live';

function findEntryForElement(element) {
  return entries.find((entry) => {
    return entry.side_hint === element.side || entry.topic === element.data_triggers?.[0] || entry.topic === element.category;
  });
}

function formatTrigger(trigger) {
  return trigger.replaceAll('_', ' ');
}

function App() {
  const [selectedElementId, setSelectedElementId] = useState('river-central-axis');
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [pulseElementId, setPulseElementId] = useState(null);
  const [liveStatus, setLiveStatus] = useState('connecting');
  const pulseQueueRef = useRef([]);
  const pulseTimeoutRef = useRef(null);

  const selectedElement = mapElements.find((element) => element.id === selectedElementId) || mapElements[0];
  const selectedEntry = findEntryForElement(selectedElement);

  const selectedCluster = useMemo(() => {
    if (!selectedEntry) return null;
    return sceneState.clusters.find((cluster) => selectedEntry.entry_ids?.includes(cluster.id)) || sceneState.clusters.find((cluster) => cluster.topic === selectedEntry.topic);
  }, [selectedEntry]);

  useEffect(() => {
    if (!liveEventsUrl) return undefined;

    const eventSource = new EventSource(liveEventsUrl);

    eventSource.addEventListener('open', () => setLiveStatus('connected'));
    eventSource.addEventListener('error', () => setLiveStatus('offline'));
    eventSource.addEventListener('connected', () => setLiveStatus('connected'));
    eventSource.addEventListener('heartbeat', () => setLiveStatus('connected'));

    eventSource.addEventListener('pulse', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.trigger === 'pulse_reveal' && payload.element_id) {
          pulseQueueRef.current.push(payload.element_id);
          processPulseQueue();
        }
      } catch (_error) {
        setLiveStatus('event_error');
      }
    });

    return () => {
      eventSource.close();
      clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hoveredElementId) processPulseQueue();
  }, [hoveredElementId]);

  function processPulseQueue() {
    if (hoveredElementId || pulseElementId || pulseQueueRef.current.length === 0) return;

    const nextElementId = pulseQueueRef.current.shift();
    setPulseElementId(nextElementId);

    pulseTimeoutRef.current = setTimeout(() => {
      setPulseElementId(null);
      processPulseQueue();
    }, 4200);
  }

  return (
    <main className="app-shell">
      <section className="viewport" aria-label="Border of Evidence vertical slice">
        <div className="map-stage">
          <div className="map-canvas">
            <img className="map-art-image" src={artManifest.base.src} alt="MAP 22 base artwork" />
            <div className="map-vignette" />
            <div className="map-grain" />

            {mapElements.map((element) => {
              const isActive = selectedElementId === element.id;
              const isPulsing = pulseElementId === element.id;

              return (
                <button
                  key={element.id}
                  className={`map-element ${element.side} ${element.visual_state} ${isActive ? 'active' : ''} ${isPulsing ? 'pulse-reveal' : ''}`}
                  style={{ left: `${element.position.x}%`, top: `${element.position.y}%` }}
                  onClick={() => setSelectedElementId(element.id)}
                  onMouseEnter={() => setHoveredElementId(element.id)}
                  onMouseLeave={() => setHoveredElementId(null)}
                  onFocus={() => setHoveredElementId(element.id)}
                  onBlur={() => setHoveredElementId(null)}
                  type="button"
                  title={`${element.label} · ${element.category}`}
                  aria-label={`${element.label}: ${element.category}`}
                >
                  <span className="element-pulse" />
                  <span className="element-label">{element.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <header className="hud top-hud">
          <div>
            <p className="eyebrow">MAP 22 seed system / live element logic</p>
            <h1>Border of Evidence</h1>
          </div>
          <nav>
            <a>Live landscape</a>
            <a>Evidence</a>
            <a>Archive</a>
            <a>Forum</a>
          </nav>
        </header>

        <aside className="hud side-panel">
          <div className="panel-kicker">
            {selectedElement.side === 'shared' ? <Waves size={16} /> : selectedElement.side === 'regenerative' ? <Leaf size={16} /> : <ShieldAlert size={16} />}
            {selectedElement.side} / {selectedElement.visual_state}
          </div>

          <h2>{selectedElement.label}</h2>
          <p className="claim">{selectedElement.description}</p>

          <dl className="metadata-grid">
            <div>
              <dt>category</dt>
              <dd>{selectedElement.category.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>zone</dt>
              <dd>{selectedElement.zone}</dd>
            </div>
            <div>
              <dt>state</dt>
              <dd>{selectedElement.visual_state}</dd>
            </div>
            <div>
              <dt>order</dt>
              <dd>{statusOrder[selectedElement.visual_state] || 0}</dd>
            </div>
          </dl>

          <div className="trigger-list" aria-label="data triggers">
            <span>data triggers</span>
            <div>
              {selectedElement.data_triggers.map((trigger) => (
                <button key={trigger} type="button">{formatTrigger(trigger)}</button>
              ))}
            </div>
          </div>

          <div className="cluster-card">
            <Trees size={18} />
            <div>
              <span>linked evidence logic</span>
              <strong>{selectedEntry?.visual_effect || 'waiting for data'}</strong>
              <small>{selectedCluster?.id || selectedEntry?.id || selectedElement.id}</small>
            </div>
          </div>

          <p className="element-note">{selectedElement.notes}</p>

          {selectedEntry ? (
            <a className="source-link" href={selectedEntry.source_url} target="_blank" rel="noreferrer">
              <Archive size={16} />
              source / archive entry
              <ExternalLink size={14} />
            </a>
          ) : null}
        </aside>

        <footer className="hud bottom-hud">
          <div>
            <span>border</span>
            <strong>{artManifest.border.type}</strong>
          </div>
          <div>
            <span>live events</span>
            <strong>{liveStatus}</strong>
          </div>
          <div>
            <span>seed elements</span>
            <strong>{mapElements.length}</strong>
          </div>
          <div>
            <span>selected</span>
            <strong>{selectedElement.side}</strong>
          </div>
        </footer>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
