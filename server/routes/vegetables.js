import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET all vegetables
router.get('/', async (req, res, next) => {
  try {
    const vegetables = await sql`
      SELECT id, name, variety, unit, image, created_at
      FROM vegetables
      ORDER BY name, variety
    `;
    res.json(vegetables);
  } catch (error) {
    next(error);
  }
});

// POST - Create new vegetable
router.post('/', async (req, res, next) => {
  try {
    const { name, variety, unit, image } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: 'Name and unit are required' });
    }

    const result = await sql`
      INSERT INTO vegetables (name, variety, unit, image)
      VALUES (${name}, ${variety || null}, ${unit}, ${image || null})
      ON CONFLICT (name, variety)
      DO UPDATE SET unit = ${unit}, image = ${image || null}
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE - Remove vegetable
router.delete('/', async (req, res, next) => {
  try {
    const { name, variety } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await sql`
      DELETE FROM vegetables
      WHERE name = ${name}
      AND (variety = ${variety || null} OR (variety IS NULL AND ${variety || null} IS NULL))
    `;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
