import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Entities
router.get('/entities', async (req, res) => {
  try {
    const take = Number(req.query.limit ?? 50);
    const skip = Number(req.query.offset ?? 0);
    const items = await prisma.legalEntity.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/entities', async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.entity_type || !body.name) {
      return res.status(400).json({ error: 'entity_type and name are required' });
    }
    const created = await prisma.legalEntity.create({
      data: {
        entityType: body.entity_type,
        name: body.name,
        externalId: body.external_id ?? null,
        metadata: body.metadata ?? {},
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Relationships
router.get('/relationships', async (req, res) => {
  try {
    const take = Number(req.query.limit ?? 50);
    const skip = Number(req.query.offset ?? 0);
    const items = await prisma.legalRelationship.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/relationships', async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.from_entity_id || !body.to_entity_id || !body.relation_type) {
      return res
        .status(400)
        .json({ error: 'from_entity_id, to_entity_id and relation_type are required' });
    }
    const created = await prisma.legalRelationship.create({
      data: {
        fromEntityId: body.from_entity_id,
        toEntityId: body.to_entity_id,
        relationType: body.relation_type,
        metadata: body.metadata ?? {},
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

