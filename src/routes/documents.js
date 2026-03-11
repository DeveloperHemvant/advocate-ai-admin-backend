import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateEmbeddingsFromLegalAi } from '../services/legalAiService.js';
import { randomUUID } from 'node:crypto';

const router = Router();
router.use(authMiddleware);

// Simple paragraph-based chunking for now
function chunkText(raw) {
  const paragraphs = String(raw || '')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
  for (const p of paragraphs) {
    if (p.length <= 1200) {
      chunks.push(p);
    } else {
      // naive split for very long paragraphs
      for (let i = 0; i < p.length; i += 1200) {
        chunks.push(p.slice(i, i + 1200));
      }
    }
  }
  return chunks;
}

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const take = Number(req.query.limit ?? 50);
    const skip = Number(req.query.offset ?? 0);
    const items = await prisma.legalDocument.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await prisma.legalDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents - create + ingest chunks + embeddings
router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.title || !body.document_type || !body.text) {
      return res
        .status(400)
        .json({ error: 'title, document_type and text are required fields' });
    }
    const created = await prisma.legalDocument.create({
      data: {
        title: body.title,
        court: body.court ?? null,
        year: body.year ?? null,
        jurisdiction: body.jurisdiction ?? null,
        documentType: body.document_type,
        text: body.text,
        metadata: body.metadata ?? {},
      },
    });

    const chunks = chunkText(body.text);
    if (chunks.length) {
      const embRes = await generateEmbeddingsFromLegalAi({ texts: chunks });
      const vectors = Array.isArray(embRes?.vectors) ? embRes.vectors : [];
      for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i];
        const vec = vectors[i];
        const id = randomUUID();
        const metadata = { index: i };
        // Store embedding as pgvector via raw SQL cast
        if (Array.isArray(vec) && vec.length) {
          const literal = `[${vec.join(',')}]`;
          // eslint-disable-next-line no-await-in-loop
          await prisma.$executeRawUnsafe(
            'INSERT INTO "legal_ai"."legal_chunks" (id, document_id, chunk_text, embedding, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4::public.vector, $5::jsonb, NOW(), NOW())',
            id,
            created.id,
            text,
            literal,
            JSON.stringify(metadata),
          );
        } else {
          // eslint-disable-next-line no-await-in-loop
          await prisma.legalChunk.create({
            data: {
              id,
              documentId: created.id,
              chunkText: text,
              metadata,
            },
          });
        }
      }
    }

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

