import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
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
    // GET all harvests
    if (event.httpMethod === 'GET') {
      const harvests = await sql`
        SELECT id, vegetable_id, vegetable_name, quantity, unit, date, notes, photo, created_at
        FROM harvests
        ORDER BY date DESC, created_at DESC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(harvests),
      };
    }

    // POST - Create new harvest
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { vegetableName, quantity, unit, date, notes, photo } = body;

      if (!vegetableName || !quantity || !unit || !date) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Vegetable name, quantity, unit, and date are required' }),
        };
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

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0]),
      };
    }

    // DELETE - Remove harvest
    if (event.httpMethod === 'DELETE') {
      const pathParts = event.path.split('/');
      const id = pathParts[pathParts.length - 1];

      if (!id || id === 'harvests') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Harvest ID is required' }),
        };
      }

      await sql`
        DELETE FROM harvests
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
    console.error('Error in harvests function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
    };
  }
};

export { handler };
