import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Dataset versions
router.get('/', async (_req, res) => {
  const items = await prisma.datasetVersion.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

router.post('/', async (req, res) => {
  const { name, notes } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const created = await prisma.datasetVersion.create({ data: { name, notes: notes ?? null } });
  res.status(201).json(created);
});

router.get('/:id', async (req, res) => {
  const item = await prisma.datasetVersion.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.datasetVersion.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Examples
router.get('/:id/examples', async (req, res) => {
  const { document_type, q, tag } = req.query;
  const where = { datasetVersionId: req.params.id };
  if (document_type) where.documentType = String(document_type);
  if (tag) where.tags = { has: String(tag) };
  if (q) {
    where.OR = [
      { expectedDraftText: { contains: String(q), mode: 'insensitive' } },
      { facts: { contains: String(q), mode: 'insensitive' } },
    ];
  }
  const items = await prisma.trainingExample.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

router.post('/:id/examples', async (req, res) => {
  const body = req.body ?? {};
  if (!body.document_type) return res.status(400).json({ error: 'document_type is required' });
  if (!body.expected_draft_text) return res.status(400).json({ error: 'expected_draft_text is required' });

  const created = await prisma.trainingExample.create({
    data: {
      datasetVersionId: req.params.id,
      documentType: body.document_type,
      courtType: body.court_type ?? null,
      state: body.state ?? null,
      facts: body.facts ?? null,
      inputJson: body.input_json ?? null,
      expectedDraftText: body.expected_draft_text,
      tags: Array.isArray(body.tags) ? body.tags : [],
      difficulty: body.difficulty ?? null,
      source: body.source ?? null,
    },
  });
  res.status(201).json(created);
});

router.put('/examples/:exampleId', async (req, res) => {
  const body = req.body ?? {};
  try {
    const updated = await prisma.trainingExample.update({
      where: { id: req.params.exampleId },
      data: {
        documentType: body.document_type ?? undefined,
        courtType: body.court_type ?? undefined,
        state: body.state ?? undefined,
        facts: body.facts ?? undefined,
        inputJson: body.input_json ?? undefined,
        expectedDraftText: body.expected_draft_text ?? undefined,
        tags: Array.isArray(body.tags) ? body.tags : undefined,
        difficulty: body.difficulty ?? undefined,
        source: body.source ?? undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/examples/:exampleId', async (req, res) => {
  try {
    await prisma.trainingExample.delete({ where: { id: req.params.exampleId } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

// Import examples: accept { items: TrainingExampleCreate[] }
router.post('/:id/examples:import', async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

  const created = await prisma.$transaction(
    items.map((it) =>
      prisma.trainingExample.create({
        data: {
          datasetVersionId: req.params.id,
          documentType: it.document_type,
          courtType: it.court_type ?? null,
          state: it.state ?? null,
          facts: it.facts ?? null,
          inputJson: it.input_json ?? null,
          expectedDraftText: it.expected_draft_text,
          tags: Array.isArray(it.tags) ? it.tags : [],
          difficulty: it.difficulty ?? null,
          source: it.source ?? null,
        },
      }),
    ),
  );
  res.status(201).json({ count: created.length });
});

export default router;

