// netlify/functions/ghl-property-details.js
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;

exports.handler = async (event) => {
  console.log('📥 Incoming request for property details:', {
    queryString: event.queryStringParameters,
    LOCATION_ID: LOCATION_ID ? '✅ Set' : '❌ Missing',
    ACCESS_TOKEN: ACCESS_TOKEN ? '✅ Set' : '❌ Missing'
  });

  if (!LOCATION_ID || !ACCESS_TOKEN) {
    console.error('❌ GHL credentials missing');
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Server misconfigured: Missing GHL_LOCATION_ID or GHL_ACCESS_TOKEN'
      })
    };
  }

  const { id } = event.queryStringParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Missing required query parameter: id'
      })
    };
  }

  // GHL API endpoint for fetching a single record by ID
  const url = `https://services.leadconnectorhq.com/objects/custom_objects.properties/records/${id}`;

  console.log('📡 Fetching single property record from GHL:', { url });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    const responseBody = await response.text();
    console.log('📄 GHL Response Status:', response.status);
    console.log('📄 GHL Response (first 300 chars):', responseBody.substring(0, 300));

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
          preview: responseBody.substring(0, 500)
        })
      };
    }

    if (!response.ok) {
      console.error('⚠️ GHL API error:', data);
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Failed to fetch property record',
          status: response.status,
          details: data
        })
      };
    }

    console.log('✅ Successfully fetched property record:', id);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('🔥 Function error:', error);
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
