import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Archive, ExternalLink, Leaf, ShieldAlert, Trees, Waves } from 'lucide-react';
import { TimeController } from './components/TimeController.jsx';
import './styles.css';
import entries from './mock/entries.json';
import sceneState from './mock/scene-state.json';
import artManifest from './assets/art/manifest.json';
import mapElements from './assets/art/map-elements.v1.json';

const RANGE_TO_MS = {
  '1_month': 30 * 24 * 60 * 60 * 1000,
  '3_months': 90 * 24 * 60 * 60 * 1000,
  '6_months': 180 * 24 * 60 * 60 * 1000,
  '12_months': 365 * 24 * 60 * 60 * 1000,
  '24_months': 730 * 24 * 60 * 60 * 1000,
  '10_years': 3650 * 24 * 60 * 60 * 1000,
};

const statusOrder = {
  seed: 1,
  emerging: 2,
  active: 3,
  dense: 4,
  corrected: 5,
  archived: 6,
};

const liveEventsUrl = import.meta.env.VITE_LIVE_EVENTS_URL || (import.meta.env.DEV ? 'http://localhost:8787/api/events/live' : '');
const archiveApiUrl = import.meta.env.VITE_ARCHIVE_API_URL || (import.meta.env.DEV ? 'http://localhost:8787/api/query/archive' : '');

function findEntryForElement(element) {
  return entries.find((entry) => {
    return entry.side_hint === element.side || entry.topic === element.data_triggers?.[0] || entry.topic === element.category;
  });
}

function findElementForEntry(entry) {
  const exactTriggerMatch = mapElements.find((element) => element.data_triggers?.includes(entry.topic));
  if (exactTriggerMatch) return exactTriggerMatch;

  const categoryMatch = mapElements.find((element) => element.category === entry.topic);
  if (categoryMatch) return categoryMatch;

  return mapElements.find((element) => element.side === entry.side_hint) || mapElements[0];
}

function formatTrigger(trigger) {
  return trigger.replaceAll('_', ' ');
}

function formatScore(score) {
  if (typeof score !== 'number') return null;
  return `${Math.round(score * 100)}%`;
}

function getArchivedElementCount(archiveArrangement, elementId) {
  return archiveArrangement?.element_counts?.[elementId] || 0;
}

function buildLocalArchiveArrangement(range = '1_month') {
  const now = Date.now();
  const rangeMs = RANGE_TO_MS[range] || RANGE_TO_MS['1_month'];
  const dateRange = {
    from: new Date(now - rangeMs).toISOString(),
    to: new Date(now).toISOString(),
  };

  const archiveEntries = entries
    .filter((entry) => {
      const publishedAt = new Date(entry.published_at).getTime();
      return Number.isNaN(publishedAt) || publishedAt >= now - rangeMs;
    })
    .map((entry) => {
      const element = findElementForEntry(entry);
      return {
        id: entry.id,
        element_id: element.id,
        title: entry.title,
        url: entry.source_url,
        source: entry.source_name,
        published_at: entry.published_at,
        summary: entry.summary,
        reason: entry.claim_text || entry.summary,
        evidence_score: entry.evidence_quality,
        domains: entry.tags || [],
        trigger_type: entry.event_type,
      };
    });

  const elementCounts = archiveEntries.reduce((counts, entry) => {
    counts[entry.element_id] = (counts[entry.element_id] || 0) + 1;
    return counts;
  }, {});

  const activeElements = Object.keys(elementCounts);

  return {
    range,
    generatedAt: new Date().toISOString(),
    date_range: dateRange,
    summary: {
      entries: archiveEntries.length,
      active_elements: activeElements.length,
      warning: archiveApiUrl ? null : 'static_mock_archive',
    },
    elements: activeElements.map((elementId) => ({
      element_id: elementId,
      count: elementCounts[elementId],
      scraped_links: archiveEntries
        .filter((entry) => entry.element_id === elementId)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          url: entry.url,
          source: entry.source,
          published_at: entry.published_at,
          evidenceScore: entry.evidence_score,
          trigger_type: entry.trigger_type,
          summary: entry.summary,
          reason: entry.reason,
          domains: entry.domains,
        })),
    })),
    entries: archiveEntries,
    element_counts: elementCounts,
    active_elements: activeElements,
    clusters: activeElements.map((elementId) => ({
      id: `local-cluster-${elementId}`,
      element_id: elementId,
      count: elementCounts[elementId],
      entries: archiveEntries.filter((entry) => entry.element_id === elementId).map((entry) => entry.id),
    })),
    scene_state: {
      active_elements: activeElements,
      density_by_element: elementCounts,
      generated_at: new Date().toISOString(),
    },
  };
}

function entriesToLiveEvents(archiveEntries, generatedAt, source = 'static_archive') {
  return archiveEntries.slice(0, 10).map((entry) => ({
    trigger: 'archive_arrangement',
    element_id: entry.element_id,
    timestamp: generatedAt,
    source,
    payload: {
      title: entry.title,
      url: entry.url,
      source: entry.source,
      published_at: entry.published_at,
      summary: entry.summary,
      reason: entry.reason,
      evidenceScore: entry.evidence_score,
      domains: entry.domains,
      trigger_type: entry.trigger_type,
    },
  }));
}

function App() {
  const [selectedElementId, setSelectedElementId] = useState('river-central-axis');
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [pulseElementId, setPulseElementId] = useState(null);
  const [liveStatus, setLiveStatus] = useState(liveEventsUrl ? 'connecting' : 'static');
  const [liveEvents, setLiveEvents] = useState(() => {
    const localArchive = buildLocalArchiveArrangement('1_month');
    return entriesToLiveEvents(localArchive.entries, localArchive.generatedAt);
  });
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [currentRange, setCurrentRange] = useState('1_month');
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [archiveArrangement, setArchiveArrangement] = useState(() => buildLocalArchiveArrangement('1_month'));
  const [archiveError, setArchiveError] = useState(null);
  const pulseQueueRef = useRef([]);
  const pulseTimeoutRef = useRef(null);

  const selectedElement = mapElements.find((element) => element.id === selectedElementId) || mapElements[0];
  const selectedEntry = findEntryForElement(selectedElement);
  const selectedArchiveElement = archiveArrangement?.elements?.find((element) => element.element_id === selectedElement.id);

  const selectedCluster = useMemo(() => {
    if (!selectedEntry) return null;
    return sceneState.clusters.find((cluster) => selectedEntry.entry_ids?.includes(cluster.id)) || sceneState.clusters.find((cluster) => cluster.topic === selectedEntry.topic);
  }, [selectedEntry]);

  useEffect(() => {
    if (!liveEventsUrl) {
      setLiveStatus('static');
      return undefined;
    }

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
          setLiveEvents((currentEvents) => [payload, ...currentEvents].slice(0, 10));
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

  async function handleRangeChange(nextRange) {
    setCurrentRange(nextRange);
    setArchiveError(null);

    if (!archiveApiUrl) {
      const localArchive = buildLocalArchiveArrangement(nextRange);
      setArchiveArrangement(localArchive);
      setLiveEvents(entriesToLiveEvents(localArchive.entries, localArchive.generatedAt));
      setLiveStatus('static');
      return;
    }

    setIsArchiveLoading(true);

    try {
      const url = new URL(archiveApiUrl);
      url.searchParams.set('range', nextRange);
      const response = await fetch(url.toString());
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'archive query failed');
      }

      setArchiveArrangement(payload);
      setLiveEvents((currentEvents) => [
        ...entriesToLiveEvents(payload.entries, payload.generatedAt, 'archive_query'),
        ...currentEvents,
      ].slice(0, 10));
    } catch (error) {
      setArchiveError(error.message);
    } finally {
      setIsArchiveLoading(false);
    }
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
              const archiveCount = getArchivedElementCount(archiveArrangement, element.id);
              const isArchiveActive = archiveCount > 0;

              return (
                <button
                  key={element.id}
                  className={`map-element ${element.side} ${element.visual_state} ${isActive ? 'active' : ''} ${isPulsing ? 'pulse-reveal' : ''} ${isArchiveActive ? 'archive-active' : ''}`}
                  style={{ left: `${element.position.x}%`, top: `${element.position.y}%`, '--archive-count': archiveCount }}
                  onClick={() => setSelectedElementId(element.id)}
                  onMouseEnter={() => setHoveredElementId(element.id)}
                  onMouseLeave={() => setHoveredElementId(null)}
                  onFocus={() => setHoveredElementId(element.id)}
                  onBlur={() => setHoveredElementId(null)}
                  type="button"
                  title={`${element.label} · ${element.category}${archiveCount ? ` · ${archiveCount} archive links` : ''}`}
                  aria-label={`${element.label}: ${element.category}${archiveCount ? ` · ${archiveCount} archive links` : ''}`}
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

        <TimeController currentRange={currentRange} onRangeChange={handleRangeChange} isLoading={isArchiveLoading} />

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
              <dt>archive links</dt>
              <dd>{selectedArchiveElement?.count || 0}</dd>
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

          {selectedArchiveElement?.scraped_links?.length ? (
            <div className="archive-links">
              <span>scraped links</span>
              {selectedArchiveElement.scraped_links.slice(0, 5).map((link) => (
                <a key={link.id || link.url} href={link.url} target="_blank" rel="noreferrer">
                  {link.title}
                </a>
              ))}
            </div>
          ) : null}

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

        <aside className={`hud evidence-drawer ${isEvidenceDrawerOpen ? 'open' : ''}`} aria-label="live evidence drawer">
          <button type="button" className="drawer-toggle" onClick={() => setIsEvidenceDrawerOpen((isOpen) => !isOpen)}>
            <span>{archiveError || 'live evidence'}</span>
            <strong>{liveEvents.length}</strong>
          </button>
          {isEvidenceDrawerOpen ? (
            <div className="drawer-body">
              {liveEvents.length ? liveEvents.map((liveEvent, index) => {
                const evidence = liveEvent.payload || {};
                const score = formatScore(evidence.evidenceScore);
                return (
                  <article className="evidence-item" key={`${liveEvent.timestamp}-${liveEvent.element_id}-${index}`}>
                    <span>{liveEvent.element_id}</span>
                    <strong>{evidence.title || liveEvent.source || 'pulse reveal'}</strong>
                    <small>{evidence.trigger_type || liveEvent.source || 'sse'}{score ? ` · ${score}` : ''}</small>
                  </article>
                );
              }) : <p className="drawer-empty">waiting for validated evidence</p>}
            </div>
          ) : null}
        </aside>

        <footer className="hud bottom-hud">
          <div>
            <span>archive range</span>
            <strong>{currentRange.replace('_', ' ')}</strong>
          </div>
          <div>
            <span>live events</span>
            <strong>{liveStatus}</strong>
          </div>
          <div>
            <span>archive entries</span>
            <strong>{archiveArrangement?.summary?.entries || 0}</strong>
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
