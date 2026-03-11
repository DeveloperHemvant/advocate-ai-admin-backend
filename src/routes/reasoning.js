import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateReasoningFromLegalAi } from '../services/legalAiService.js';

const router = Router();
router.use(authMiddleware);

// GET /api/reasoning - list reasoning records (paged)
router.get('/', async (req, res) => {
  try {
    const take = Number(req.query.limit ?? 50);
    const skip = Number(req.query.offset ?? 0);
    const items = await prisma.legalReasoning.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reasoning/generate - generate IRAC reasoning and persist
router.post('/generate', async (req, res) => {
  try {
    const { case_type, facts, context } = req.body ?? {};
    if (!case_type || !facts) {
      return res.status(400).json({ error: 'case_type and facts are required' });
    }
    const ai = await generateReasoningFromLegalAi({
      case_type,
      facts,
      context: context || '',
    });
    const created = await prisma.legalReasoning.create({
      data: {
        caseType: case_type,
        issue: ai.issue,
        rule: ai.rule,
        application: ai.application,
        conclusion: ai.conclusion,
        citations: ai.citations ?? '',
        metadata: {},
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

