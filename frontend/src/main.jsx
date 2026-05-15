import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Archive, CircleDot, ExternalLink, Leaf, ShieldAlert, Trees, Waves } from 'lucide-react';
import './styles.css';
import entries from './mock/entries.json';
import sceneState from './mock/scene-state.json';
import artManifest from './assets/art/manifest.json';

const hotspots = artManifest.hotspots;

function getEntry(entryId) {
  return entries.find((entry) => entry.id === entryId) || entries[0];
}

function App() {
  const [selectedHotspotId, setSelectedHotspotId] = useState('soil-health-carbon');
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) || hotspots[0];
  const selectedEntry = getEntry(selectedHotspot.entryId);
  const selectedCluster = useMemo(() => {
    return sceneState.clusters.find((cluster) => selectedEntry.entry_ids?.includes(cluster.id)) || sceneState.clusters.find((cluster) => cluster.topic === selectedEntry.topic);
  }, [selectedEntry]);

  return (
    <main className="app-shell">
      <section className="viewport" aria-label="Border of Evidence vertical slice">
        <div className="map-stage">
          <img className="map-art-image" src={artManifest.base.src} alt="MAP-based evidence landscape scaffold" />
          <div className="map-vignette" />
          <div className="map-grain" />
          <div className="river-annotation">river border</div>
          <div className="fixed-pivot">fixed method</div>

          {hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              className={`hotspot ${hotspot.side} ${selectedHotspotId === hotspot.id ? 'active' : ''}`}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              onClick={() => setSelectedHotspotId(hotspot.id)}
              type="button"
            >
              {hotspot.side === 'shared' ? <Waves size={18} /> : <CircleDot size={18} />}
              <span>{hotspot.label}</span>
            </button>
          ))}
        </div>

        <header className="hud top-hud">
          <div>
            <p className="eyebrow">vertical slice / MAP scaffold</p>
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
            {selectedHotspot.side === 'shared' ? <Waves size={16} /> : selectedEntry.side_hint === 'regenerative' ? <Leaf size={16} /> : <ShieldAlert size={16} />}
            {selectedHotspot.side === 'shared' ? 'river / method' : selectedEntry.side_hint}
          </div>
          <h2>{selectedEntry.title}</h2>
          <p className="claim">{selectedEntry.claim_text}</p>

          <dl className="metadata-grid">
            <div>
              <dt>event</dt>
              <dd>{selectedEntry.event_type}</dd>
            </div>
            <div>
              <dt>topic</dt>
              <dd>{selectedEntry.topic}</dd>
            </div>
            <div>
              <dt>quality</dt>
              <dd>{Math.round(selectedEntry.evidence_quality * 100)}%</dd>
            </div>
            <div>
              <dt>confidence</dt>
              <dd>{Math.round(selectedEntry.confidence * 100)}%</dd>
            </div>
          </dl>

          <div className="cluster-card">
            <Trees size={18} />
            <div>
              <span>scene effect</span>
              <strong>{selectedEntry.visual_effect}</strong>
              <small>{selectedCluster?.id || selectedHotspot.id}</small>
            </div>
          </div>

          <a className="source-link" href={selectedEntry.source_url} target="_blank" rel="noreferrer">
            <Archive size={16} />
            source / archive entry
            <ExternalLink size={14} />
          </a>
        </aside>

        <footer className="hud bottom-hud">
          <div>
            <span>border</span>
            <strong>{artManifest.border.type}</strong>
          </div>
          <div>
            <span>base art</span>
            <strong>{artManifest.base.status}</strong>
          </div>
          <div>
            <span>min visible share</span>
            <strong>{Math.round(sceneState.pivot.min_visible_share * 100)}%</strong>
          </div>
          <div>
            <span>hotspots</span>
            <strong>{hotspots.length}</strong>
          </div>
        </footer>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
