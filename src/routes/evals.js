import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scoreDraft } from '../services/scoringService.js';
import { generateDraftFromLegalAi } from '../services/legalAiService.js';

const router = Router();
router.use(authMiddleware);

// Batch eval (generation is wired next step; scoring works now)
// POST /api/evals/:datasetVersionId/run
router.post('/:datasetVersionId/run', async (req, res) => {
  try {
    const datasetVersionId = req.params.datasetVersionId;
    const dataset = await prisma.datasetVersion.findUnique({ where: { id: datasetVersionId } });
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const examples = await prisma.trainingExample.findMany({ where: { datasetVersionId } });

    const run = await prisma.trainingRun.create({
      data: {
        type: 'RAG_EVAL',
        status: 'RUNNING',
        datasetVersionId,
        baseModel: req.body?.base_model ?? null,
        embeddingModel: req.body?.embedding_model ?? null,
        paramsJson: req.body?.params_json ?? null,
        logsText:
          'Evaluation created. Generation will be enabled next; scoring is applied to any generated output.',
        startedAt: new Date(),
      },
    });

    // Generate drafts via Legal AI service, score, and store results.
    for (const ex of examples) {
      let generatedText = '';
      let failureReason = null;
      try {
        const payload = {
          document_type: ex.documentType,
          case_facts: ex.facts ?? '',
          court_name: ex.courtType ?? undefined,
          state: ex.state ?? undefined,
          ...(ex.inputJson && typeof ex.inputJson === 'object' ? ex.inputJson : {}),
        };
        const out = await generateDraftFromLegalAi(payload);
        generatedText = out?.draft ?? '';
        if (!generatedText) failureReason = 'EMPTY_OUTPUT';
      } catch (e) {
        failureReason = `GEN_ERROR: ${e.message}`;
      }
      const s = scoreDraft({
        expected: ex.expectedDraftText,
        generated: generatedText,
        facts: ex.facts ?? '',
      });
      await prisma.evaluationResult.create({
        data: {
          trainingRunId: run.id,
          trainingExampleId: ex.id,
          generatedText,
          scoreOverall: s.scoreOverall,
          scoreFormat: s.scoreFormat,
          scoreCoverage: s.scoreCoverage,
          scoreSimilarity: s.scoreSimilarity,
          // Map heuristic scores into advanced metrics to keep pipeline simple
          legalAccuracy: s.scoreOverall,
          citationAccuracy: s.scoreCoverage,
          argumentQuality: s.scoreOverall,
          structureQuality: s.scoreFormat,
          languageQuality: s.scoreSimilarity,
          judgeFeedbackJson: null,
          failureReason,
          reviewStatus: 'UNREVIEWED',
          reviewNotes: null,
          retrievedContextIds: [],
        },
      });
    }

    const finished = await prisma.trainingRun.update({
      where: { id: run.id },
      data: { status: 'SUCCEEDED', endedAt: new Date() },
    });

    res.status(201).json({ run: finished, examples: examples.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Review workflow: update result and optionally update expected output
// PATCH /api/evals/results/:id
router.patch('/results/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const result = await prisma.evaluationResult.findUnique({
      where: { id: req.params.id },
      include: { trainingExample: true },
    });
    if (!result) return res.status(404).json({ error: 'Not found' });

    const reviewStatus = body.review_status ?? undefined;
    const reviewNotes = body.review_notes ?? undefined;

    if (body.expected_draft_text) {
      await prisma.trainingExample.update({
        where: { id: result.trainingExampleId },
        data: { expectedDraftText: body.expected_draft_text },
      });
    }

    const updated = await prisma.evaluationResult.update({
      where: { id: result.id },
      data: {
        reviewStatus,
        reviewNotes,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

