import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { document_type, template_text } = req.body;
    const template = await prisma.legalTemplate.create({
      data: {
        documentType: document_type,
        templateText: template_text,
      },
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { document_type } = req.query;
    const where = document_type ? { documentType: document_type } : {};
    const templates = await prisma.legalTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { document_type, template_text } = req.body;
    const template = await prisma.legalTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(document_type != null && { documentType: document_type }),
        ...(template_text != null && { templateText: template_text }),
      },
    });
    res.json(template);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
