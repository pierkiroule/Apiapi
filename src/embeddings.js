import { env, pipeline } from '@xenova/transformers';

// Config strictement hors-ligne : charge uniquement depuis /public/models
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models';
env.useBrowserCache = true;

let cachedEmbedder;

export async function loadEmbedder() {
  if (!cachedEmbedder) {
    cachedEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
  }
  return cachedEmbedder;
}

export async function embedVocabulary(vocabulary, maxWords = 40) {
  const embedder = await loadEmbedder();
  const limited = vocabulary.slice(0, maxWords);
  const embeddings = new Map();

  for (const word of limited) {
    const output = await embedder(word, { pooling: 'mean', normalize: true });
    embeddings.set(word, Array.from(output.data));
  }

  return embeddings;
}

export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}
