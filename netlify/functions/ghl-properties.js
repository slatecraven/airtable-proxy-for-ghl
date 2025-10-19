// netlify/functions/ghl-properties.js
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;

exports.handler = async (event) => {
  const { page = 1, perPage = 8 } = event.queryStringParameters || {};
  const limit = Math.min(Math.max(parseInt(perPage, 10) || 8, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const url = new URL('https://services.leadconnectorhq.com/custom/objects');
  url.searchParams.append('locationId', LOCATION_ID);
  url.searchParams.append('objectType', 'Property');
  url.searchParams.append('limit', limit);
  url.searchParams.append('offset', offset);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('GHL API error:', await response.text());
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch properties' })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // optional: cache for 60s
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
