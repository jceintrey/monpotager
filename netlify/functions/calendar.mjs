import { sql } from './db.mjs';

/**
 * Netlify Function: Calendar API
 * GET /api/calendar - Get calendar entries (defaults + user overrides)
 * GET /api/calendar?vegetable=Tomates - Filter by vegetable name
 * GET /api/calendar?climate_id=1 - Filter by climate
 * POST /api/calendar - Create user calendar override
 * PUT /api/calendar/:id - Update user calendar override
 * DELETE /api/calendar/:id - Delete user calendar override
 */

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET - Retrieve calendar entries
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const vegetableName = params.vegetable;
      const climateId = params.climate_id ? parseInt(params.climate_id) : null;
      const userId = params.user_id || 'default_user';

      // Use the view that combines defaults + overrides
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
        WHERE (user_id IS NULL OR user_id = ${userId})
      `;

      // Apply filters
      if (vegetableName) {
        query = sql`${query} AND vegetable_name ILIKE ${'%' + vegetableName + '%'}`;
      }

      if (climateId) {
        query = sql`${query} AND climate_id = ${climateId}`;
      }

      query = sql`${query}
        ORDER BY vegetable_name ASC, sowing_start_decade ASC
      `;

      const entries = await query;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(entries),
      };
    }

    // POST - Create user calendar override
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        user_id = 'default_user',
        vegetable_name,
        sowing_type_id,
        sowing_start_decade,
        sowing_end_decade,
        harvest_start_decade,
        harvest_end_decade,
        growth_duration_days,
        notes,
      } = body;

      // Validation
      if (
        !vegetable_name ||
        !sowing_type_id ||
        !sowing_start_decade ||
        !sowing_end_decade ||
        !harvest_start_decade ||
        !harvest_end_decade
      ) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing required fields',
            required: [
              'vegetable_name',
              'sowing_type_id',
              'sowing_start_decade',
              'sowing_end_decade',
              'harvest_start_decade',
              'harvest_end_decade',
            ],
          }),
        };
      }

      // Validate decade ranges
      const isValidDecade = (d) => d >= 1 && d <= 36;
      if (
        !isValidDecade(sowing_start_decade) ||
        !isValidDecade(sowing_end_decade) ||
        !isValidDecade(harvest_start_decade) ||
        !isValidDecade(harvest_end_decade)
      ) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Decade values must be between 1 and 36',
          }),
        };
      }

      const result = await sql`
        INSERT INTO user_calendar_overrides (
          user_id,
          vegetable_name,
          sowing_type_id,
          sowing_start_decade,
          sowing_end_decade,
          harvest_start_decade,
          harvest_end_decade,
          growth_duration_days,
          notes,
          is_active
        ) VALUES (
          ${user_id},
          ${vegetable_name},
          ${sowing_type_id},
          ${sowing_start_decade},
          ${sowing_end_decade},
          ${harvest_start_decade},
          ${harvest_end_decade},
          ${growth_duration_days || null},
          ${notes || null},
          TRUE
        )
        ON CONFLICT (user_id, vegetable_name, sowing_type_id, sowing_start_decade)
        DO UPDATE SET
          sowing_end_decade = EXCLUDED.sowing_end_decade,
          harvest_start_decade = EXCLUDED.harvest_start_decade,
          harvest_end_decade = EXCLUDED.harvest_end_decade,
          growth_duration_days = EXCLUDED.growth_duration_days,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0]),
      };
    }

    // PUT - Update user calendar override
    if (event.httpMethod === 'PUT') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id || id === 'calendar' || isNaN(parseInt(id))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Calendar entry ID is required' }),
        };
      }

      const body = JSON.parse(event.body || '{}');
      const {
        sowing_start_decade,
        sowing_end_decade,
        harvest_start_decade,
        harvest_end_decade,
        growth_duration_days,
        notes,
        is_active,
      } = body;

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (sowing_start_decade !== undefined) {
        updates.push('sowing_start_decade = $' + (values.length + 1));
        values.push(sowing_start_decade);
      }
      if (sowing_end_decade !== undefined) {
        updates.push('sowing_end_decade = $' + (values.length + 1));
        values.push(sowing_end_decade);
      }
      if (harvest_start_decade !== undefined) {
        updates.push('harvest_start_decade = $' + (values.length + 1));
        values.push(harvest_start_decade);
      }
      if (harvest_end_decade !== undefined) {
        updates.push('harvest_end_decade = $' + (values.length + 1));
        values.push(harvest_end_decade);
      }
      if (growth_duration_days !== undefined) {
        updates.push('growth_duration_days = $' + (values.length + 1));
        values.push(growth_duration_days);
      }
      if (notes !== undefined) {
        updates.push('notes = $' + (values.length + 1));
        values.push(notes);
      }
      if (is_active !== undefined) {
        updates.push('is_active = $' + (values.length + 1));
        values.push(is_active);
      }

      if (updates.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No fields to update' }),
        };
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const result = await sql`
        UPDATE user_calendar_overrides
        SET ${sql(updates.join(', '))}
        WHERE id = ${parseInt(id)}
        RETURNING *
      `;

      if (result.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Calendar entry not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result[0]),
      };
    }

    // DELETE - Remove user calendar override
    if (event.httpMethod === 'DELETE') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id || id === 'calendar' || isNaN(parseInt(id))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Calendar entry ID is required' }),
        };
      }

      await sql`
        DELETE FROM user_calendar_overrides
        WHERE id = ${parseInt(id)}
      `;

      return {
        statusCode: 204,
        headers,
        body: '',
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in calendar function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
    };
  }
};
