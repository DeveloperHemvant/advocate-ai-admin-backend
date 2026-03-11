const STOPWORDS = new Set([
  'the','and','for','with','that','this','from','have','has','had','will','shall','into','your','you','are','was','were',
  'applicant','respondent','petitioner','court','case','facts','hereby','thereof','therein','herein','whereas','thereby',
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function similarityJaccard(a, b) {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union ? inter / union : 0;
}

export function coverageScore(facts, generated, maxKeywords = 12) {
  const tokens = tokenize(facts).filter((t) => t.length >= 5 && !STOPWORDS.has(t));
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([t]) => t);

  if (keywords.length === 0) return 0.5;
  const genTokens = new Set(tokenize(generated));
  let hit = 0;
  for (const k of keywords) if (genTokens.has(k)) hit++;
  return hit / keywords.length;
}

export function formatScore(generated) {
  const txt = String(generated || '').toUpperCase();
  if (!txt.trim()) return 0;
  const headings = ['IN THE', 'MOST RESPECTFULLY', 'PRAYER', 'VERIFICATION', 'FACTS', 'GROUNDS'];
  const hits = headings.filter((h) => txt.includes(h)).length;
  return Math.min(1, hits / 3);
}

export function scoreDraft({ expected, generated, facts }) {
  const sim = similarityJaccard(expected, generated);
  const cov = coverageScore(facts, generated);
  const fmt = formatScore(generated);
  const overall = 0.5 * sim + 0.3 * cov + 0.2 * fmt;
  return {
    scoreOverall: Number(overall.toFixed(4)),
    scoreSimilarity: Number(sim.toFixed(4)),
    scoreCoverage: Number(cov.toFixed(4)),
    scoreFormat: Number(fmt.toFixed(4)),
  };
}

