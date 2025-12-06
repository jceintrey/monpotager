import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET all sowing types
router.get('/', async (req, res, next) => {
  try {
    const sowingTypes = await sql`
      SELECT id, name, icon, description
      FROM sowing_types
      ORDER BY id
    `;
    res.json(sowingTypes);
  } catch (error) {
    next(error);
  }
});

export default router;
