import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req, res) => {
  const items = await prisma.trainingRun.findMany({
    orderBy: { createdAt: 'desc' },
    include: { datasetVersion: true },
  });
  res.json(items);
});

router.post('/', async (req, res) => {
  const body = req.body ?? {};
  if (!body.type) return res.status(400).json({ error: 'type is required' });
  if (!body.dataset_version_id) return res.status(400).json({ error: 'dataset_version_id is required' });

  const created = await prisma.trainingRun.create({
    data: {
      type: body.type,
      status: 'DRAFT',
      datasetVersionId: body.dataset_version_id,
      baseModel: body.base_model ?? null,
      embeddingModel: body.embedding_model ?? null,
      paramsJson: body.params_json ?? null,
      logsText: null,
      startedAt: null,
      endedAt: null,
    },
  });
  res.status(201).json(created);
});

router.get('/:id', async (req, res) => {
  const item = await prisma.trainingRun.findUnique({
    where: { id: req.params.id },
    include: { datasetVersion: true },
  });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.get('/:id/results', async (req, res) => {
  const items = await prisma.evaluationResult.findMany({
    where: { trainingRunId: req.params.id },
    orderBy: { createdAt: 'desc' },
    include: { trainingExample: true },
  });
  res.json(items);
});

// Starts a run. For now, this only flips status; actual evaluation is handled by /api/evals.
router.post('/:id/start', async (req, res) => {
  try {
    const updated = await prisma.trainingRun.update({
      where: { id: req.params.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        logsText: (req.body?.note ? String(req.body.note) : null) ?? undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;

