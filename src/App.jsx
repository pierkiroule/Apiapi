import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { parseText } from './parser.js';
import { embedVocabulary } from './embeddings.js';
import { buildNetwork } from './network.js';
import { kMeans } from './cluster.js';
import { computeExistentialDiagram } from './existentialDiagram.js';
import { synthesize } from './synthese.js';
import { exampleTexts } from './samples.js';
import { exportDiagram, renderBubbleDiagram } from './chartLite.js';

const steps = ['Input', 'Nuage', 'Réseau', 'Diagramme', 'Synthèse'];

function useIndexedDB() {
  const save = (data) =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open('existential-db', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('sessions');
      };
      request.onsuccess = () => {
        const tx = request.result.transaction('sessions', 'readwrite');
        tx.objectStore('sessions').put(data, 'last');
        tx.oncomplete = resolve;
        tx.onerror = reject;
      };
    });

  return { save };
}

function WordCloud({ frequency }) {
  const entries = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);
  if (!entries.length) return <p className="note">Aucune donnée pour l'instant.</p>;
  const max = entries[0][1] || 1;
  return (
    <div className="word-cloud fade">
      {entries.map(([word, count]) => {
        const size = 0.9 + (count / max) * 1.4;
        return (
          <span key={word} className="word-chip" style={{ fontSize: `${size}rem` }}>
            {word}
          </span>
        );
      })}
    </div>
  );
}

function NetworkView({ network }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !network) return undefined;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...network.nodes, ...network.edges],
      layout: { name: 'cose', animate: false },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366f1',
            label: 'data(label)',
            color: '#0f172a',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 'mapData(weight, 1, 10, 16, 28)',
            height: 'mapData(weight, 1, 10, 16, 28)',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 'mapData(weight, 1, 6, 1, 4)',
            'line-color': '#c7d2fe',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#c7d2fe',
            'curve-style': 'bezier',
          },
        },
      ],
    });

    return () => cy.destroy();
  }, [network]);

  return <div ref={containerRef} style={{ height: 340 }} className="fade" />;
}

function DiagramView({ points, clusters, onExport }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !points.length) return undefined;
    return renderBubbleDiagram(canvasRef.current, points, clusters);
  }, [points, clusters]);

  const handleExport = () => {
    if (canvasRef.current) {
      const url = exportDiagram(canvasRef.current);
      onExport(url);
    }
  };

  return (
    <div className="canvas-card fade">
      <canvas ref={canvasRef} aria-label="Diagramme existentiel" />
      <div className="button-row" style={{ marginTop: '0.75rem' }}>
        <button type="button" onClick={handleExport} disabled={!points.length}>
          Exporter le diagramme (PNG)
        </button>
      </div>
    </div>
  );
}

function Synthesis({ summary }) {
  if (!summary) return <p className="note">Analyse en attente.</p>;
  return (
    <div className="fade">
      <h3>Noyau existentiel</h3>
      <p className="pill">{summary.noyau.join(' • ') || '—'}</p>
      <h3>Tensions à suivre</h3>
      <ul className="list">
        {summary.tensions.length ? summary.tensions.map((t) => <li key={t}>{t}</li>) : <li>Pas de tension marquée.</li>}
      </ul>
      <h3>Ressources activables</h3>
      <ul className="list">
        {summary.ressources.length ? summary.ressources.map((r) => <li key={r}>{r}</li>) : <li>Ressources à explorer.</li>}
      </ul>
      <h3>Questions réflexives</h3>
      <ul className="list">
        {summary.questions.map((q, idx) => (
          <li key={idx}>{q}</li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState(exampleTexts[0].content);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(null);
  const [network, setNetwork] = useState(null);
  const [points, setPoints] = useState([]);
  const [clusters, setClusters] = useState(new Map());
  const [summary, setSummary] = useState(null);
  const { save } = useIndexedDB();

  const nextStep = (target) => setStep(target);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setParsed(null);
    setNetwork(null);
    setPoints([]);
    setSummary(null);
    try {
      const parsedText = parseText(text);
      const vocabulary = Object.entries(parsedText.frequency)
        .sort((a, b) => b[1] - a[1])
        .map(([w]) => w);
      const embeddings = await embedVocabulary(vocabulary, 40);
      const actantNetwork = buildNetwork(parsedText.tokens, embeddings);
      const { labels } = kMeans(embeddings, 4, 7);
      const diagramPoints = computeExistentialDiagram(embeddings, actantNetwork, parsedText.frequency);
      const synthese = synthesize(diagramPoints);

      setParsed(parsedText);
      setNetwork(actantNetwork);
      setClusters(labels);
      setPoints(diagramPoints);
      setSummary(synthese);
      setStep(1);

      await save({
        createdAt: new Date().toISOString(),
        text,
        frequency: parsedText.frequency,
        diagramPoints,
        synthese,
      });
    } catch (err) {
      setError("Analyse interrompue. Vérifiez le modèle local ou réessayez.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagramme-existentiel.png';
    link.click();
  };

  return (
    <div className="app-shell">
      <div className="header card">
        <div>
          <h1 className="title">Paysage existentiel</h1>
          <p className="subtitle">Webapp ultra-frugale, 100% offline (React + Vite).</p>
        </div>
        <div className="pill">Analyse locale</div>
      </div>

      <div className="card">
        <div className="stepper">
          {steps.map((label, idx) => (
            <div key={label} className={`step ${step === idx ? 'active' : ''}`}>
              {label}
            </div>
          ))}
        </div>

        <div className="button-row" style={{ marginBottom: '0.75rem' }}>
          {exampleTexts.map((sample) => (
            <button key={sample.title} type="button" onClick={() => setText(sample.content)}>
              Charger : {sample.title}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Collez un récit clinique pour cartographier le paysage existentiel."
        />
        <div className="button-row" style={{ marginTop: '0.75rem' }}>
          <button type="button" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Chargement du modèle...' : 'Lancer l’analyse locale'}
          </button>
        </div>
        {error && <p className="note">{error}</p>}
      </div>

      {parsed && (
        <div className="card">
          <h2 className="title">1. Nuage de mots</h2>
          <p className="subtitle">Segmentation, nettoyage, lemmatisation légère.</p>
          <WordCloud frequency={parsed.frequency} />
          <div className="button-row">
            <button type="button" onClick={() => nextStep(2)} disabled={!parsed}>
              Étape suivante
            </button>
          </div>
        </div>
      )}

      {network && step >= 2 && (
        <div className="card">
          <h2 className="title">2. Réseau d’actants (ANT)</h2>
          <p className="subtitle">Cooccurrences + proximité sémantique (MiniLM local).</p>
          <NetworkView network={network} />
          <div className="button-row">
            <button type="button" onClick={() => nextStep(3)}>
              Voir le diagramme
            </button>
          </div>
        </div>
      )}

      {points.length > 0 && step >= 3 && (
        <div className="card">
          <h2 className="title">3. Diagramme existentiel 2D</h2>
          <p className="subtitle">Centralité (Je + affect) × densité relationnelle.</p>
          <DiagramView points={points} clusters={clusters} onExport={handleExport} />
          <div className="button-row">
            <button type="button" onClick={() => nextStep(4)}>
              Synthèse douce
            </button>
          </div>
        </div>
      )}

      {summary && step >= 4 && (
        <div className="card">
          <h2 className="title">4. Synthèse clinique</h2>
          <p className="subtitle">Heuristiques : noyau, tensions, ressources, questions.</p>
          <Synthesis summary={summary} />
        </div>
      )}

      <div className="card note">
        <strong>Usage hors-ligne :</strong> le modèle MiniLM doit être présent dans <code>public/models</code> pour rester 100% local.
        Aucun appel réseau n’est nécessaire après téléchargement.
      </div>
    </div>
  );
}
