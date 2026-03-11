import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { analyzeJudgmentWithLegalAi } from '../services/legalAiService.js';

const router = Router();
router.use(authMiddleware);

// GET /api/judgment-analysis
router.get('/', async (req, res) => {
  try {
    const take = Number(req.query.limit ?? 50);
    const skip = Number(req.query.offset ?? 0);
    const items = await prisma.judgmentAnalysis.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { document: true },
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/judgment-analysis/:documentId/analyze
router.post('/:documentId/analyze', async (req, res) => {
  try {
    const doc = await prisma.legalDocument.findUnique({
      where: { id: req.params.documentId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const ai = await analyzeJudgmentWithLegalAi({
      text: doc.text,
      extra_context: '',
    });

    const created = await prisma.judgmentAnalysis.create({
      data: {
        documentId: doc.id,
        factsSummary: ai.facts_summary,
        legalIssues: ai.legal_issues,
        courtReasoning: ai.court_reasoning,
        finalDecision: ai.final_decision,
        keyCitations: ai.key_citations ?? '',
        metadata: {},
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

