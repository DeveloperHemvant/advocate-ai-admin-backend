import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { triggerEmbedding } from '../services/embeddingService.js';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const draft = await prisma.legalDraft.create({
      data: {
        documentType: body.document_type,
        title: body.title ?? null,
        facts: body.facts ?? null,
        draftText: body.draft_text,
        courtType: body.court_type ?? null,
        state: body.state ?? null,
      },
    });
    await triggerEmbedding('draft', draft.id, draft);
    res.status(201).json(draft);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { document_type, q } = req.query;
    const where = {};
    if (document_type) where.documentType = document_type;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { facts: { contains: q, mode: 'insensitive' } },
        { draftText: { contains: q, mode: 'insensitive' } },
      ];
    }
    const drafts = await prisma.legalDraft.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const draft = await prisma.legalDraft.findUnique({ where: { id: req.params.id } });
    if (!draft) return res.status(404).json({ error: 'Not found' });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    const draft = await prisma.legalDraft.update({
      where: { id: req.params.id },
      data: {
        documentType: body.document_type ?? undefined,
        title: body.title ?? undefined,
        facts: body.facts ?? undefined,
        draftText: body.draft_text ?? undefined,
        courtType: body.court_type ?? undefined,
        state: body.state ?? undefined,
      },
    });
    await triggerEmbedding('draft', draft.id, draft);
    res.json(draft);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.legalDraft.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
