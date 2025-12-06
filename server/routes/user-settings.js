import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET - Get user settings
router.get('/', async (req, res, next) => {
  try {
    const { user_id = 'default_user' } = req.query;

    let settings = await sql`
      SELECT id, user_id, climate_id, created_at, updated_at
      FROM user_settings
      WHERE user_id = ${user_id}
      LIMIT 1
    `;

    // If no settings found, create default settings
    if (settings.length === 0) {
      settings = await sql`
        INSERT INTO user_settings (user_id, climate_id)
        VALUES (${user_id}, 1)
        RETURNING *
      `;
    }

    res.json(settings[0]);
  } catch (error) {
    next(error);
  }
});

// PUT - Update user settings
router.put('/', async (req, res, next) => {
  try {
    const { user_id = 'default_user', climate_id } = req.body;

    if (!climate_id) {
      return res.status(400).json({ error: 'Climate ID is required' });
    }

    const result = await sql`
      INSERT INTO user_settings (user_id, climate_id)
      VALUES (${user_id}, ${climate_id})
      ON CONFLICT (user_id)
      DO UPDATE SET
        climate_id = ${climate_id},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    res.json(result[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
