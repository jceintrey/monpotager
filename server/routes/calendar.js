import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET - Retrieve calendar entries
router.get('/', async (req, res, next) => {
  try {
    const { vegetable, climate_id, user_id = 'default_user' } = req.query;
    const climateId = climate_id ? parseInt(climate_id) : null;

    let query = sql`
      SELECT
        id,
        vegetable_name,
        climate_id,
        climate_name,
        sowing_type_id,
        sowing_type_code,
        sowing_type_name,
        sowing_type_icon,
        sowing_start_decade,
        sowing_end_decade,
        harvest_start_decade,
        harvest_end_decade,
        growth_duration_days,
        notes,
        is_customized,
        is_active
      FROM v_user_calendar
      WHERE (user_id IS NULL OR user_id = ${user_id})
    `;

    if (vegetable) {
      query = sql`${query} AND vegetable_name ILIKE ${'%' + vegetable + '%'}`;
    }

    if (climateId) {
      query = sql`${query} AND climate_id = ${climateId}`;
    }

    query = sql`${query}
      ORDER BY vegetable_name ASC, sowing_start_decade ASC
    `;

    const entries = await query;
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// POST - Create user calendar override
router.post('/', async (req, res, next) => {
  try {
    const {
      userId = 'default_user',
      vegetableName,
      climateId,
      sowingTypeId,
      sowingStartDecade,
      sowingEndDecade,
      harvestStartDecade,
      harvestEndDecade,
      growthDurationDays,
      notes,
      isActive = true,
    } = req.body;

    if (!vegetableName || !climateId || !sowingTypeId) {
      return res.status(400).json({ error: 'Vegetable name, climate ID, and sowing type ID are required' });
    }

    const result = await sql`
      INSERT INTO user_calendar_overrides (
        user_id,
        vegetable_name,
        climate_id,
        sowing_type_id,
        sowing_start_decade,
        sowing_end_decade,
        harvest_start_decade,
        harvest_end_decade,
        growth_duration_days,
        notes,
        is_active
      )
      VALUES (
        ${userId},
        ${vegetableName},
        ${climateId},
        ${sowingTypeId},
        ${sowingStartDecade},
        ${sowingEndDecade},
        ${harvestStartDecade},
        ${harvestEndDecade},
        ${growthDurationDays || null},
        ${notes || null},
        ${isActive}
      )
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    next(error);
  }
});

// PUT - Update user calendar override
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      sowingStartDecade,
      sowingEndDecade,
      harvestStartDecade,
      harvestEndDecade,
      growthDurationDays,
      notes,
      isActive,
    } = req.body;

    const result = await sql`
      UPDATE user_calendar_overrides
      SET
        sowing_start_decade = ${sowingStartDecade},
        sowing_end_decade = ${sowingEndDecade},
        harvest_start_decade = ${harvestStartDecade},
        harvest_end_decade = ${harvestEndDecade},
        growth_duration_days = ${growthDurationDays || null},
        notes = ${notes || null},
        is_active = ${isActive !== undefined ? isActive : true},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Calendar override not found' });
    }

    res.json(result[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE - Delete user calendar override
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await sql`
      DELETE FROM user_calendar_overrides
      WHERE id = ${parseInt(id)}
    `;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
