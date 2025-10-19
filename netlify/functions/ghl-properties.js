// netlify/functions/ghl-properties.js
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;

if (!LOCATION_ID || !ACCESS_TOKEN) {
  console.error('❌ Missing GHL_LOCATION_ID or GHL_ACCESS_TOKEN in env');
}

exports.handler = async (event) => {
  const { page = 1, perPage = 8 } = event.queryStringParameters || {};
  const limit = Math.min(Math.max(parseInt(perPage, 10) || 8, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  // Validate env vars early
  if (!LOCATION_ID || !ACCESS_TOKEN) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Server misconfigured: missing GHL credentials' })
    };
  }

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

    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Log raw response for debugging
      const text = await response.text();
      console.error('Non-JSON response from GHL:', text);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid response from GHL API' })
      };
    }

    if (!response.ok) {
      console.error('GHL API error:', data);
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'GHL API returned error', details: data })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'  // ← THIS FIXES CORS
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
