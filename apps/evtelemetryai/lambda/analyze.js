/**
 * AWS Lambda Function for AI Fleet Analysis
 * Handles POST requests to /api/analyze
 * Keeps Google GenAI API_KEY secure
 */

const { GoogleGenAI } = require('@google/genai');

const API_KEY = process.env.GOOGLE_GENAI_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  console.log('Lambda invoke:', event);

  // Handle CORS preflight
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  // Only allow POST
  if (event.requestContext.http.method !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { summaries, riders, dateRange } = JSON.parse(event.body);

    // Validate input
    if (!summaries || !Array.isArray(summaries)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'summaries array is required' }),
      };
    }
    if (!riders || !Array.isArray(riders)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'riders array is required' }),
      };
    }

    // Check API key
    if (!API_KEY) {
      console.error('API Key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'API Key not configured on Lambda',
          message: 'Set GOOGLE_GENAI_API_KEY environment variable',
        }),
      };
    }

    // Initialize GoogleGenAI
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Prepare data summary
    const relevantSummaries = summaries.length > 40 ? summaries.slice(-40) : summaries;
    const totalCarbon = riders.reduce((acc, r) => acc + r.total_carbon_kg, 0);
    const totalDistance = riders.reduce((acc, r) => acc + r.total_distance_km, 0);

    const periodText = dateRange ? `${dateRange.start} to ${dateRange.end}` : 'Recent 30 Days';

    const systemInstruction = `You are a Senior Fleet Data Analyst for an EV Motorcycle company in Nairobi, Kenya.
      
You have upgraded your Carbon Credit methodology to an **Energy-Mass-Balance Model** augmented by AI Traffic Classification.

THE METHODOLOGY:
1. We track ACTUAL kWh used (via BMS), not just distance.
2. AI classifies traffic: 
    - Free Flow (Factor 1.8)
    - Moderate (Factor 2.5)
    - Heavy Congestion (Factor 4.0) -> Displacing inefficient ICE idling!
3. Formula: (kWh * TrafficFactor * 0.7) + (kWh * 0.5 SolarBonus).

Your goal is to analyze fleet data and find inefficiencies or revenue opportunities.`;

    const prompt = `
      FLEET DATA:
      - Total Active Fleet: ${riders.length} bikes
      - Lifetime Distance: ${totalDistance.toFixed(0)} km
      - Lifetime Carbon Saved: ${totalCarbon.toFixed(0)} kg
      
      ANALYSIS PERIOD: ${periodText}
      
      DAILY PERFORMANCE DATA (Sample):
      ${JSON.stringify(relevantSummaries)}
      
      TASK:
      1. Analyze the performance trends specifically for the period: ${periodText}.
      2. Analyze the benefit of the new "Congestion Factor". How does Nairobi's rush hour (high kWh usage, low distance) actually generate *more* credits now compared to a flat per-km model?
      3. Suggest operational improvements for the "Lunch Rush" (High congestion window) based on the data patterns.
      
      Use your "Thinking" capabilities to calculate specific scenarios.
      Return the report in Markdown format.
    `;

    // Call GoogleGenAI
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: {
          thinkingBudget: 32768,
        },
      },
    });

    const analysis = response.text || 'Analysis complete but no text returned.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: analysis,
      }),
    };
  } catch (error) {
    console.error('Lambda Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Analysis failed',
        message: error.message || 'Internal server error',
      }),
    };
  }
};
