// netlify/functions/ghl-properties.js
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;

exports.handler = async (event) => {
  // Validate environment variables
  if (!LOCATION_ID || !ACCESS_TOKEN) {
    console.error('❌ Missing GHL_LOCATION_ID or GHL_ACCESS_TOKEN');
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Server misconfigured: missing GHL credentials' })
    };
  }

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

    // ✅ Read body ONCE
    const responseBody = await response.text(); // ← Read as text first

    // Attempt to parse as JSON
    let data;
    try {
      data = JSON.parse(responseBody);
    } catch (parseError) {
      console.error('GHL returned non-JSON response:', responseBody);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid response from GHL API (not JSON)' })
      };
    }

    // Handle GHL API errors (e.g., 401, 400)
    if (!response.ok) {
      console.error('GHL API error response:', data);
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'GHL API request failed',
          status: response.status,
          details: data
        })
      };
    }

    // ✅ Success: return data with CORS header
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // ← Critical for browser access
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Netlify Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
