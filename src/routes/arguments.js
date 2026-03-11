import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateArgumentsFromLegalAi } from '../services/legalAiService.js';

const router = Router();
router.use(authMiddleware);

// GET /api/arguments
router.get('/', async (req, res) => {
  try {
    const take = Number(req.query.limit ?? 50);
    const skip = Number(req.query.offset ?? 0);
    const items = await prisma.legalArgument.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/arguments - manual create
router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.case_type || !body.argument_title || !body.argument_points) {
      return res
        .status(400)
        .json({ error: 'case_type, argument_title and argument_points are required' });
    }
    const created = await prisma.legalArgument.create({
      data: {
        caseType: body.case_type,
        argumentTitle: body.argument_title,
        argumentPoints: body.argument_points,
        supportingCases: body.supporting_cases ?? null,
        counterArguments: body.counter_arguments ?? null,
        metadata: body.metadata ?? {},
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/arguments/generate - generate arguments via AI and store
router.post('/generate', async (req, res) => {
  try {
    const { case_type, facts, jurisdiction } = req.body ?? {};
    if (!case_type || !facts) {
      return res.status(400).json({ error: 'case_type and facts are required' });
    }
    const ai = await generateArgumentsFromLegalAi({ case_type, facts, jurisdiction });
    const created = await prisma.legalArgument.create({
      data: {
        caseType: case_type,
        argumentTitle: `Auto: ${case_type}`,
        argumentPoints: { arguments: ai.arguments },
        supportingCases: { text: ai.supporting_cases },
        counterArguments: { text: ai.counter_arguments },
        metadata: { supporting_sections: ai.supporting_sections },
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

