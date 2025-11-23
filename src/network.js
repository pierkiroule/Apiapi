import { cosineSimilarity } from './embeddings.js';

function addEdge(edges, source, target, weight) {
  const key = `${source}::${target}`;
  edges.set(key, (edges.get(key) || 0) + weight);
}

export function buildCooccurrence(tokens, windowSize = 3) {
  const edges = new Map();
  const lemmas = tokens.map((t) => t.lemma);
  for (let i = 0; i < lemmas.length; i += 1) {
    for (let j = i + 1; j <= Math.min(i + windowSize, lemmas.length - 1); j += 1) {
      const a = lemmas[i];
      const b = lemmas[j];
      if (a !== b) {
        addEdge(edges, a, b, 1);
        addEdge(edges, b, a, 1);
      }
    }
  }
  return edges;
}

export function buildNetwork(tokens, embeddings, minWeight = 1) {
  const edges = buildCooccurrence(tokens);
  const frequency = tokens.reduce((acc, t) => {
    acc[t.lemma] = (acc[t.lemma] || 0) + 1;
    return acc;
  }, {});

  const nodes = Array.from(new Set(tokens.map((t) => t.lemma))).map((id) => ({
    data: { id, label: id, weight: frequency[id] || 1 },
  }));

  const edgeList = [];
  edges.forEach((weight, key) => {
    const [source, target] = key.split('::');
    if (weight >= minWeight) {
      const semantic = cosineSimilarity(embeddings.get(source), embeddings.get(target));
      const combined = weight + Math.max(0, semantic * 2);
      edgeList.push({
        data: {
          id: `${source}-${target}`,
          source,
          target,
          weight: Number(combined.toFixed(2)),
        },
      });
    }
  });

  return { nodes, edges: edgeList };
}

export function degreeCentrality(network) {
  const degrees = new Map();
  network.edges.forEach((edge) => {
    degrees.set(edge.data.source, (degrees.get(edge.data.source) || 0) + 1);
    degrees.set(edge.data.target, (degrees.get(edge.data.target) || 0) + 1);
  });
  return degrees;
}
