import { config } from '../config/index.js';

function getBaseUrl() {
  const base = String(config.legalAiApiUrl || '').replace(/\/$/, '');
  if (!base) {
    throw new Error('LEGAL_AI_API_URL is not configured');
  }
  return base;
}

async function postJson(path, body) {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || 'Legal AI service error');
  }
  return data;
}

export async function generateDraftFromLegalAi(input) {
  return postJson('/generate-draft', input);
}

export async function generateReasoningFromLegalAi(input) {
  return postJson('/generate-reasoning', input);
}

export async function generateArgumentsFromLegalAi(input) {
  return postJson('/generate-arguments', input);
}

export async function generateCitationsFromLegalAi(input) {
  return postJson('/generate-citations', input);
}

export async function generateEmbeddingsFromLegalAi(input) {
  return postJson('/generate-embeddings', input);
}

export async function analyzeJudgmentWithLegalAi(input) {
  return postJson('/analyze-judgment', input);
}

