import { sql } from './db.mjs';

/**
 * Netlify Function: Climates API
 * GET /api/climates - Get all available climates
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
    // GET - Retrieve all climates
    if (event.httpMethod === 'GET') {
      const climates = await sql`
        SELECT id, name, description, created_at
        FROM climates
        ORDER BY id ASC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(climates),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in climates function:', error);
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
