// =========================================================================
// get-data.js - Netlify Function with CORS Fix
// =========================================================================

const Airtable = require('airtable');

// Initialize Airtable using environment variables set in Netlify
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const tableName = process.env.AIRTABLE_TABLE_ID; 

// --- CORS HEADERS ---
// It is safer to use the exact domain of the app making the request (e.g., GoHighLevel)
// If you are unsure of the exact domain or sub-domain, '*' is a quick fix, but less secure.
const HEADERS = {
    // 💡 BEST PRACTICE: Use the specific domain that is loading this widget/code. 
    // Example: 'https://app.gohighlevel.com' or 'https://yourclientdomain.com'
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};
// --------------------

exports.handler = async (event, context) => {

    // 1. Handle preflight OPTIONS request (required by CORS)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: HEADERS,
            body: '',
        };
    }
    
    // 2. Handle actual GET request
    try {
        const records = await base(tableName).select({
            // Ensure you are requesting the fields required by your frontend code
            // Optionally, add filtering or sorting here if needed
        }).all();

        return {
            statusCode: 200,
            headers: HEADERS, // Include CORS headers in the successful response
            body: JSON.stringify({ 
                records: records 
            }),
        };

    } catch (error) {
        console.error('Airtable Error:', error.message);

        return {
            statusCode: 500,
            headers: HEADERS, // Include CORS headers even on error
            body: JSON.stringify({ 
                error: 'Failed to fetch data from Airtable.', 
                details: error.message 
            }),
        };
    }
};
