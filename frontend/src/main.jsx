import React, { useMemo, useState } from 'react';
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
  const selectedElement = mapElements.find((element) => element.id === selectedElementId) || mapElements[0];
  const selectedEntry = findEntryForElement(selectedElement);

  const selectedCluster = useMemo(() => {
    if (!selectedEntry) return null;
    return sceneState.clusters.find((cluster) => selectedEntry.entry_ids?.includes(cluster.id)) || sceneState.clusters.find((cluster) => cluster.topic === selectedEntry.topic);
  }, [selectedEntry]);

  return (
    <main className="app-shell">
      <section className="viewport" aria-label="Border of Evidence vertical slice">
        <div className="map-stage">
          <div className="map-canvas">
            <img className="map-art-image" src={artManifest.base.src} alt="MAP-based evidence landscape scaffold" />
            <div className="map-vignette" />
            <div className="map-grain" />
            <div className="river-annotation">river border</div>
            <div className="fixed-pivot">fixed method</div>

            {mapElements.map((element) => (
              <button
                key={element.id}
                className={`map-element ${element.side} ${element.visual_state} ${selectedElementId === element.id ? 'active' : ''}`}
                style={{ left: `${element.position.x}%`, top: `${element.position.y}%` }}
                onClick={() => setSelectedElementId(element.id)}
                type="button"
                title={`${element.label} · ${element.category}`}
                aria-label={`${element.label}: ${element.category}`}
              >
                <span className="element-pulse" />
                <span className="element-label">{element.label}</span>
              </button>
            ))}
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
            <span>target state</span>
            <strong>MAP 22</strong>
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
