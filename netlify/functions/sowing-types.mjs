import { sql } from './db.mjs';

/**
 * Netlify Function: Sowing Types API
 * GET /api/sowing-types - Get all sowing types
 */

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET - Retrieve all sowing types
    if (event.httpMethod === 'GET') {
      const sowingTypes = await sql`
        SELECT id, code, name, description, icon, created_at
        FROM sowing_types
        ORDER BY id ASC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sowingTypes),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in sowing-types function:', error);
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
