import { cosineSimilarity } from './embeddings.js';
import { degreeCentrality } from './network.js';

const affective = {
  positif: ['calme', 'joie', 'espoir', 'doux', 'fier', 'libre', 'apaisé', 'paix', 'enthousiasme', 'stabilité'],
  negatif: ['peur', 'colere', 'colère', 'fatigue', 'tension', 'douleur', 'manque', 'doute', 'crainte', 'solitude'],
};

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function affectiveCharge(word, frequency) {
  const base = frequency[word] || 0;
  if (affective.positif.includes(word)) return 0.4 + base * 0.05;
  if (affective.negatif.includes(word)) return -0.4 - base * 0.05;
  return 0;
}

export function computeExistentialDiagram(embeddings, network, frequency) {
  const degrees = degreeCentrality(network);
  const neighborCounts = new Map();
  network.edges.forEach((edge) => {
    neighborCounts.set(edge.data.source, (neighborCounts.get(edge.data.source) || new Set()).add(edge.data.target));
    neighborCounts.set(edge.data.target, (neighborCounts.get(edge.data.target) || new Set()).add(edge.data.source));
  });

  const selfVector = embeddings.get('je') || embeddings.get('moi') || embeddings.values().next().value;
  const metrics = [];

  embeddings.forEach((vector, word) => {
    const proximity = selfVector ? cosineSimilarity(vector, selfVector) : 0.3;
    const affect = affectiveCharge(word, frequency);
    const centrality = proximity + affect;

    const deg = degrees.get(word) || 0;
    const diversity = (neighborCounts.get(word) || new Set()).size;
    const density = deg + diversity * 0.8;

    metrics.push({ word, centrality, density, size: (frequency[word] || 1) + 2 });
  });

  const centralities = metrics.map((m) => m.centrality);
  const densities = metrics.map((m) => m.density);
  const minC = Math.min(...centralities);
  const maxC = Math.max(...centralities);
  const minD = Math.min(...densities);
  const maxD = Math.max(...densities);

  return metrics.map((m) => ({
    word: m.word,
    x: Number(normalize(m.centrality, minC, maxC).toFixed(2)),
    y: Number(normalize(m.density, minD, maxD).toFixed(2)),
    r: Math.min(16, m.size * 2),
  }));
}

// Les données normalisées sont désormais consommées par un renderer canvas léger (chartLite).
