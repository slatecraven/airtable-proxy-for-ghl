// The Airtable dependency is installed automatically by Netlify because of package.json
const Airtable = require('airtable');

// The main handler function Netlify runs
exports.handler = async (event, context) => {
    try {
        // Use environment variables (the SECRET keys you set in Netlify)
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
            .base(process.env.AIRTABLE_BASE_ID);

        // Fetch records from your specific table
        const records = await base('tblcOQyuXLYWTAfs9') 
            .select({
                // Add your filtering or sorting options here
                filterByFormula: "{ShowOnWebsite} = 'Yes'", 
                // Only request the fields you need
                fields: ["Name", "Rate", "Bio"],
                maxRecords: 50 
            })
            .firstPage();

        // Map and clean the data before sending it back
        const cleanData = records.map(record => ({
            id: record.id,
            name: record.get('Name'),
            rate: record.get('Rate')
        }));

        // Send a successful response (status 200) with the data
        return {
            statusCode: 200,
            body: JSON.stringify(cleanData),
            headers: {
                // Allows your GHL page (or any domain) to call this endpoint
                'Access-Control-Allow-Origin': '*', 
                'Content-Type': 'application/json'
            }
        };

    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to access the database.' }),
        };
    }
};