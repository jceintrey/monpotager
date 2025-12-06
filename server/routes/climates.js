import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET all climates
router.get('/', async (req, res, next) => {
  try {
    const climates = await sql`
      SELECT id, name, description
      FROM climates
      ORDER BY id
    `;
    res.json(climates);
  } catch (error) {
    next(error);
  }
});

export default router;
