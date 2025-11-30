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
    // GET all vegetables
    if (event.httpMethod === 'GET') {
      const vegetables = await sql`
        SELECT id, name, variety, unit, image, created_at
        FROM vegetables
        ORDER BY name, variety
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(vegetables),
      };
    }

    // POST - Create new vegetable
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, variety, unit, image } = body;

      if (!name || !unit) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Name and unit are required' }),
        };
      }

      const result = await sql`
        INSERT INTO vegetables (name, variety, unit, image)
        VALUES (${name}, ${variety || null}, ${unit}, ${image || null})
        ON CONFLICT (name, variety)
        DO UPDATE SET unit = ${unit}, image = ${image || null}
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0]),
      };
    }

    // DELETE - Remove vegetable
    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const { name, variety } = body;

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Name is required' }),
        };
      }

      await sql`
        DELETE FROM vegetables
        WHERE name = ${name}
        AND (variety = ${variety || null} OR (variety IS NULL AND ${variety || null} IS NULL))
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
    console.error('Error in vegetables function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
    };
  }
};

export { handler };
