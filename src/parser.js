const stopwords = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi',
  'dont', 'où', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 'ne', 'pas', 'plus',
  'au', 'aux', 'en', 'dans', 'avec', 'sans', 'pour', 'par', 'sur', 'sous', 'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes',
  'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'leur', 'leurs', 'y', 'là', 'ici', 'lui', 'elle', 'eux', 'elles', 'comme', 'quand',
  'lorsque', 'si', 'seulement', 'bien', 'alors', 'tres', 'très', 'être', 'etre', 'fait', 'fais', 'faites', 'avoir', 'ai', 'a',
]);

const lemmatizationRules = [
  [/aient$|ions$|iez$|ais$|ait$|ai$|as$|a$|er$|ez$/, 'er'],
  [/issons$|issent$|issais$|issait$|is$|it$|ir$/, 'ir'],
  [/ant$|ante$|antes$|ants$/, 'ant'],
  [/ements$|ement$/, ''],
  [/tions$|tion$/, 'tion'],
  [/ments$|ment$/, 'ment'],
  [/ances$|ance$/, 'ance'],
];

export function cleanText(text) {
  return text
    .normalize('NFC')
    .replace(/['’]/g, ' ')
    .replace(/[^a-zA-ZÀ-ÿ\.\?!\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lemmatize(word) {
  const lower = word.toLowerCase();
  for (const [pattern, suffix] of lemmatizationRules) {
    if (pattern.test(lower)) {
      return lower.replace(pattern, suffix) || lower;
    }
  }
  return lower;
}

export function segmentSentences(text) {
  return text
    .split(/(?<=[\.\?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tokenize(text) {
  const clean = cleanText(text);
  const words = clean.split(/\s+/);
  return words
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2 && !stopwords.has(w))
    .map((w) => ({ original: w, lemma: lemmatize(w) }));
}

export function parseText(text) {
  const sentences = segmentSentences(text);
  const tokens = tokenize(text).map((token, index) => ({ ...token, sentence: Math.floor(index / 20) }));

  const frequency = tokens.reduce((acc, token) => {
    const key = token.lemma;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    sentences,
    tokens,
    frequency,
  };
}
