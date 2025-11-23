function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

function meanVector(vectors) {
  if (!vectors.length) return [];
  const length = vectors[0].length;
  const mean = Array(length).fill(0);
  vectors.forEach((vec) => {
    for (let i = 0; i < length; i += 1) {
      mean[i] += vec[i];
    }
  });
  return mean.map((v) => v / vectors.length);
}

export function kMeans(embeddingMap, k = 3, iterations = 8) {
  const entries = Array.from(embeddingMap.entries());
  if (!entries.length) return { labels: new Map(), centroids: [] };

  const centroids = entries.slice(0, k).map(([, vector]) => vector.slice());
  const labels = new Map();

  for (let iter = 0; iter < iterations; iter += 1) {
    entries.forEach(([word, vector]) => {
      let best = 0;
      let bestDist = Infinity;
      centroids.forEach((centroid, idx) => {
        const dist = euclideanDistance(vector, centroid);
        if (dist < bestDist) {
          bestDist = dist;
          best = idx;
        }
      });
      labels.set(word, best);
    });

    for (let c = 0; c < k; c += 1) {
      const clusterVectors = entries
        .filter(([word]) => labels.get(word) === c)
        .map(([, vector]) => vector);
      if (clusterVectors.length) {
        centroids[c] = meanVector(clusterVectors);
      }
    }
  }

  return { labels, centroids };
}
