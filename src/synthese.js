const tensionLexicon = ['peur', 'tension', 'fatigue', 'doute', 'colere', 'colère', 'manque', 'crainte'];
const resourceLexicon = ['calme', 'joie', 'ami', 'amis', 'soutien', 'marche', 'soleil', 'vent', 'foyer', 'liberté', 'liberte'];

export function extractNoyau(points) {
  return points
    .slice()
    .sort((a, b) => b.x + b.y - (a.x + a.y))
    .slice(0, 3)
    .map((p) => p.word);
}

export function detectTensions(points) {
  return points
    .filter((p) => tensionLexicon.includes(p.word) || p.x < 0.35)
    .slice(0, 3)
    .map((p) => p.word);
}

export function detectRessources(points) {
  return points
    .filter((p) => resourceLexicon.includes(p.word) || p.y > 0.55)
    .slice(0, 3)
    .map((p) => p.word);
}

export function buildQuestions(noyau, tensions, ressources) {
  const anchors = noyau.join(', ');
  return [
    `Quand ces éléments (${anchors}) sont présents, qu'est-ce qui devient plus clair ?`,
    tensions.length
      ? `Comment s'expriment ${tensions.join(', ')} dans votre corps et vos relations ?`
      : "Quelles sensations vous signalent que quelque chose se tend ?",
    ressources.length
      ? `Dans quelles situations ${ressources.join(', ')} sont-elles mobilisables sans effort ?`
      : 'Quelles micro-ressources pourraient être réactivées au quotidien ?',
  ];
}

export function synthesize(points) {
  const noyau = extractNoyau(points);
  const tensions = detectTensions(points);
  const ressources = detectRessources(points);
  const questions = buildQuestions(noyau, tensions, ressources);

  return {
    noyau,
    tensions,
    ressources,
    questions,
  };
}
