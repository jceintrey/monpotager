import { sql } from './db.mjs';

/**
 * Netlify Function: User Settings API
 * GET /api/user-settings - Get user settings (climate preference, etc.)
 * PUT /api/user-settings - Update user settings
 */

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = event.queryStringParameters?.user_id || 'default_user';

    // GET - Retrieve user settings
    if (event.httpMethod === 'GET') {
      const settings = await sql`
        SELECT
          us.id,
          us.user_id,
          us.climate_id,
          c.name as climate_name,
          c.description as climate_description,
          us.preferences,
          us.created_at,
          us.updated_at
        FROM user_settings us
        LEFT JOIN climates c ON us.climate_id = c.id
        WHERE us.user_id = ${userId}
        LIMIT 1
      `;

      if (settings.length === 0) {
        // Create default settings if not found
        const defaultSettings = await sql`
          INSERT INTO user_settings (user_id, climate_id)
          VALUES (${userId}, 1)
          RETURNING
            id,
            user_id,
            climate_id,
            preferences,
            created_at,
            updated_at
        `;

        // Fetch with climate details
        const result = await sql`
          SELECT
            us.id,
            us.user_id,
            us.climate_id,
            c.name as climate_name,
            c.description as climate_description,
            us.preferences,
            us.created_at,
            us.updated_at
          FROM user_settings us
          LEFT JOIN climates c ON us.climate_id = c.id
          WHERE us.id = ${defaultSettings[0].id}
        `;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result[0]),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(settings[0]),
      };
    }

    // PUT - Update user settings
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { climate_id, preferences } = body;

      // Build update query
      const updates = [];

      if (climate_id !== undefined) {
        // Validate climate_id exists
        const climateExists = await sql`
          SELECT id FROM climates WHERE id = ${climate_id}
        `;

        if (climateExists.length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid climate_id' }),
          };
        }
      }

      const result = await sql`
        UPDATE user_settings
        SET
          climate_id = COALESCE(${climate_id || null}, climate_id),
          preferences = COALESCE(${preferences ? JSON.stringify(preferences) : null}::jsonb, preferences),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING
          id,
          user_id,
          climate_id,
          preferences,
          created_at,
          updated_at
      `;

      if (result.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User settings not found' }),
        };
      }

      // Fetch with climate details
      const settings = await sql`
        SELECT
          us.id,
          us.user_id,
          us.climate_id,
          c.name as climate_name,
          c.description as climate_description,
          us.preferences,
          us.created_at,
          us.updated_at
        FROM user_settings us
        LEFT JOIN climates c ON us.climate_id = c.id
        WHERE us.id = ${result[0].id}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(settings[0]),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in user-settings function:', error);
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
