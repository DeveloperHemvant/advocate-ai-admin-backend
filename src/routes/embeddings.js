import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { regenerateAllEmbeddings } from '../services/embeddingService.js';

const router = Router();
router.use(authMiddleware);

// POST /api/embeddings/rebuild { contentType?: 'law'|'judgment'|'draft'|'question' }
router.post('/rebuild', async (req, res) => {
  try {
    const { contentType } = req.body ?? {};
    const total = await regenerateAllEmbeddings(contentType ?? null);
    res.json({ ok: true, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

