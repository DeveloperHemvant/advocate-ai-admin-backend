import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { triggerEmbedding } from '../services/embeddingService.js';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const law = await prisma.law.create({
      data: {
        lawType: body.law_type,
        sectionNumber: body.section_number,
        title: body.title ?? null,
        description: body.description ?? null,
        punishment: body.punishment ?? null,
        bailable: body.bailable ?? null,
        cognizable: body.cognizable ?? null,
        courtType: body.court_type ?? null,
      },
    });
    await triggerEmbedding('law', law.id, law);
    res.status(201).json(law);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { law_type, q } = req.query;
    const where = {};
    if (law_type) where.lawType = law_type;
    if (q) {
      where.OR = [
        { sectionNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    const laws = await prisma.law.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(laws);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const law = await prisma.law.findUnique({ where: { id: req.params.id } });
    if (!law) return res.status(404).json({ error: 'Not found' });
    res.json(law);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    const law = await prisma.law.update({
      where: { id: req.params.id },
      data: {
        lawType: body.law_type,
        sectionNumber: body.section_number,
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        punishment: body.punishment ?? undefined,
        bailable: body.bailable ?? undefined,
        cognizable: body.cognizable ?? undefined,
        courtType: body.court_type ?? undefined,
      },
    });
    await triggerEmbedding('law', law.id, law);
    res.json(law);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.law.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
