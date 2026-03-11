import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { triggerEmbedding } from '../services/embeddingService.js';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { question, answer, source } = req.body;
    const record = await prisma.legalQuestion.create({
      data: {
        question,
        answer: answer ?? '',
        source: source ?? null,
      },
    });
    await triggerEmbedding('question', record.id, record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const where = q
      ? {
          OR: [
            { question: { contains: q, mode: 'insensitive' } },
            { answer: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const questions = await prisma.legalQuestion.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
