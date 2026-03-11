/**
 * Embedding service: generates embeddings for legal content and stores in DB.
 * Calls an external embedding API (e.g. Python legal-ai /embed endpoint) or
 * stores content for later batch embedding. Vector stored as JSON string of float array.
 */

import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

function textForEmbedding(contentType, record) {
  switch (contentType) {
    case 'law':
      return [record.lawType, record.sectionNumber, record.title, record.description, record.punishment]
        .filter(Boolean)
        .join(' ');
    case 'judgment':
      return [record.caseTitle, record.courtName, record.summary, record.fullText]
        .filter(Boolean)
        .join(' ');
    case 'draft':
      return [record.documentType, record.title, record.facts, record.draftText]
        .filter(Boolean)
        .join(' ');
    case 'question':
      return [record.question, record.answer].filter(Boolean).join(' ');
    default:
      return String(record);
  }
}

/**
 * Call external embedding API (e.g. Python BGE service). Expects POST /embed
 * body: { text: string }, response: { embedding: number[] }
 */
async function fetchEmbedding(text) {
  const url = config.embeddingServiceUrl?.replace(/\/$/, '') + '/embed';
  if (!config.embeddingServiceUrl || !text) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const vec = data.embedding || data.vector;
    return Array.isArray(vec) ? vec : null;
  } catch (_) {
    return null;
  }
}

/**
 * Upsert embedding row. Vector stored as JSON string.
 */
async function upsertEmbedding(contentType, contentId, vector) {
  if (!vector || !vector.length) return;
  const vectorJson = JSON.stringify(vector);
  await prisma.embedding.upsert({
    where: {
      contentType_contentId: { contentType, contentId },
    },
    create: { contentType, contentId, vector: vectorJson },
    update: { vector: vectorJson },
  });
}

/**
 * Trigger embedding generation and storage. Called after create/update of law, judgment, draft, question.
 * If EMBEDDING_SERVICE_URL is set, calls it and stores result; otherwise skips (batch job can run later).
 */
export async function triggerEmbedding(contentType, contentId, record) {
  const text = textForEmbedding(contentType, record);
  const vector = await fetchEmbedding(text);
  if (vector) await upsertEmbedding(contentType, contentId, vector);
}

/**
 * Regenerate embeddings for all content of a type (or all). For use in cron or admin action.
 */
export async function regenerateAllEmbeddings(contentType = null) {
  const types = contentType ? [contentType] : ['law', 'judgment', 'draft', 'question'];
  let total = 0;
  for (const type of types) {
    let records = [];
    if (type === 'law') records = await prisma.law.findMany();
    else if (type === 'judgment') records = await prisma.judgment.findMany();
    else if (type === 'draft') records = await prisma.legalDraft.findMany();
    else if (type === 'question') records = await prisma.legalQuestion.findMany();
    for (const r of records) {
      await triggerEmbedding(type, r.id, r);
      total++;
    }
  }
  return total;
}
