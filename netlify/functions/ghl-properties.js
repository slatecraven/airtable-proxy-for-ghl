// netlify/functions/ghl-properties.js
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;

exports.handler = async (event) => {
  console.log('📥 Incoming request:', {
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

  const { page = 1, perPage = 4, category } = event.queryStringParameters || {};
  const pageInt = Math.max(parseInt(page, 10) || 1, 1);
  const pageLimit = Math.min(Math.max(parseInt(perPage, 10) || 4, 1), 100);

  // Build request body
  const body = {
    locationId: LOCATION_ID,
    page: pageInt,
    pageLimit: pageLimit,
    filters: [
      {
        field: 'properties.active_listing',
        operator: 'contains',
        value: 'yes'
      }
    ]
  };

  // Add category filter if provided
  if (category) {
    body.filters.push({
      field: 'category',
      operator: 'eq',
      value: category
    });
  }

  const url = 'https://services.leadconnectorhq.com/objects/custom_objects.properties/records/search';

  console.log('📡 Fetching from GHL Objects API:', { url, body });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const responseBody = await response.text();
    console.log('📄 GHL Response Status:', response.status);
    console.log('📄 GHL Response (first 300 chars):', responseBody.substring(0, 300));

    let data;
    try {
      data = JSON.parse(responseBody);
    } catch (parseError) {
      console.error('💥 Non-JSON response:', responseBody);
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
          error: 'GHL API request failed',
          status: response.status,
          details: data
        })
      };
    }

    console.log('✅ Fetched', (data.records || []).length, 'records');
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
