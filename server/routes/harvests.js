import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET all harvests
router.get('/', async (req, res, next) => {
  try {
    const harvests = await sql`
      SELECT id, vegetable_id, vegetable_name, quantity, unit, date, notes, photo, created_at
      FROM harvests
      ORDER BY date DESC, created_at DESC
    `;
    res.json(harvests);
  } catch (error) {
    next(error);
  }
});

// POST - Create new harvest
router.post('/', async (req, res, next) => {
  try {
    const { vegetableName, quantity, unit, date, notes, photo } = req.body;

    if (!vegetableName || !quantity || !unit || !date) {
      return res.status(400).json({ error: 'Vegetable name, quantity, unit, and date are required' });
    }

    // Find vegetable ID by name
    const vegetables = await sql`
      SELECT id FROM vegetables
      WHERE name = ${vegetableName}
      LIMIT 1
    `;

    const vegetableId = vegetables.length > 0 ? vegetables[0].id : null;

    const result = await sql`
      INSERT INTO harvests (vegetable_id, vegetable_name, quantity, unit, date, notes, photo)
      VALUES (${vegetableId}, ${vegetableName}, ${quantity}, ${unit}, ${date}, ${notes || null}, ${photo || null})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE - Remove harvest
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Harvest ID is required' });
    }

    await sql`
      DELETE FROM harvests
      WHERE id = ${parseInt(id)}
    `;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
