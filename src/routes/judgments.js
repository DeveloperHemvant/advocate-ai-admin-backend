import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { triggerEmbedding } from '../services/embeddingService.js';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const judgment = await prisma.judgment.create({
      data: {
        courtName: body.court_name,
        caseTitle: body.case_title,
        year: body.year ? parseInt(body.year, 10) : null,
        judgeName: body.judge_name ?? null,
        summary: body.summary ?? null,
        fullText: body.full_text ?? null,
        citation: body.citation ?? null,
      },
    });
    await triggerEmbedding('judgment', judgment.id, judgment);
    res.status(201).json(judgment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { court_name, q } = req.query;
    const where = {};
    if (court_name) where.courtName = court_name;
    if (q) {
      where.OR = [
        { caseTitle: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { fullText: { contains: q, mode: 'insensitive' } },
      ];
    }
    const judgments = await prisma.judgment.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(judgments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const judgment = await prisma.judgment.findUnique({ where: { id: req.params.id } });
    if (!judgment) return res.status(404).json({ error: 'Not found' });
    res.json(judgment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
