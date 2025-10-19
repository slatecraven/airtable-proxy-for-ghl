// netlify/functions/ghl-properties.js
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;

exports.handler = async (event) => {
  // Log incoming request for debugging
  console.log('📥 Incoming request:', {
    queryString: event.queryStringParameters,
    LOCATION_ID: LOCATION_ID ? '✅ Set' : '❌ Missing',
    ACCESS_TOKEN: ACCESS_TOKEN ? '✅ Set' : '❌ Missing'
  });

  // Validate environment variables
  if (!LOCATION_ID || !ACCESS_TOKEN) {
    console.error('❌ GHL credentials missing in environment variables');
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Server misconfigured: Missing GHL_LOCATION_ID or GHL_ACCESS_TOKEN'
      })
    };
  }

  const { page = 1, perPage = 8 } = event.queryStringParameters || {};
  const limit = Math.min(Math.max(parseInt(perPage, 10) || 8, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const url = new URL('https://services.leadconnectorhq.com/custom/objects');
  url.searchParams.append('locationId', LOCATION_ID);
  url.searchParams.append('objectType', 'Property'); // ← Must match your Custom Object name exactly
  url.searchParams.append('limit', limit);
  url.searchParams.append('offset', offset);

  console.log('📡 Fetching from GHL API:', url.toString());

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    // Read response ONCE as text
    const responseBody = await response.text();
    console.log('📄 GHL Raw Response Status:', response.status);
    console.log('📄 GHL Raw Response (first 300 chars):', responseBody.substring(0, 300));

    // Parse JSON safely
    let data;
    try {
      data = JSON.parse(responseBody);
    } catch (parseError) {
      console.error('💥 Non-JSON response from GHL:', responseBody);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'GHL returned invalid JSON',
          rawResponsePreview: responseBody.substring(0, 500)
        })
      };
    }

    // Handle GHL API errors (4xx/5xx)
    if (!response.ok) {
      console.error('⚠️ GHL API error response:', data);
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

    // Success!
    console.log('✅ Successfully fetched', data.records?.length || 0, 'records');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // ← Critical for browser access
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('🔥 Netlify Function runtime error:', error);
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
