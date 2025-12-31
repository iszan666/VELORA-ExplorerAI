import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- SCHEMA DEFINITION ---
const itinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tripTitle: { type: Type.STRING },
    dateRange: { type: Type.STRING },
    totalBudget: { type: Type.STRING },
    weather: { type: Type.STRING },
    currencyRate: { type: Type.STRING },
    whyDestination: { type: Type.STRING },
    localTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    packingList: { type: Type.ARRAY, items: { type: Type.STRING } },
    budgetAssumption: { type: Type.STRING },
    localContext: {
      type: Type.OBJECT,
      properties: {
        foodAndDrinks: { type: Type.ARRAY, items: { type: Type.STRING } },
        customs: { type: Type.STRING },
        etiquetteTips: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["foodAndDrinks", "customs", "etiquetteTips"]
    },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          date: { type: Type.STRING },
          title: { type: Type.STRING },
          costEstimate: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                title: { type: Type.STRING },
                desc: { type: Type.STRING },
                icon: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
                  required: ["lat", "lng"]
                }
              },
              required: ["time", "title", "desc", "icon", "coordinates"]
            }
          }
        },
        required: ["day", "date", "title", "costEstimate", "activities"]
      }
    }
  },
  required: ["tripTitle", "dateRange", "totalBudget", "weather", "days", "localTips", "packingList", "budgetAssumption", "localContext", "whyDestination"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. ALWAYS Set CORS Headers first. 
  // This ensures that even if we error out, the client can read the error JSON.
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 3. Runtime Environment Check
    // We do this inside the try/catch to return a JSON error instead of a hard crash (500 INVOCATION_FAILED).
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: GOOGLE_API_KEY is missing in Vercel Environment Variables.");
      return res.status(500).json({ 
        error: "Server Configuration Error", 
        message: "The server is missing the API Key. Please check Vercel settings." 
      });
    }

    // 4. Input Validation
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    const { action, prefs, currentItinerary, request } = req.body || {};
    
    // 5. Initialize AI Safely
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash-002"; 

    // 6. Construct Prompt
    let prompt = '';
    if (action === 'generate') {
      if (!prefs || !prefs.destination) {
         return res.status(400).json({ error: "Missing preferences or destination." });
      }
      prompt = `
        Curate a bespoke travel itinerary for ${prefs.destination}.
        Duration: ${prefs.duration} days. Budget: ${prefs.budget}. Vibe: ${prefs.vibe}.
        Return strictly JSON matching the provided schema.
        Ensure every activity has realistic latitude/longitude coordinates.
        Assume trip starts tomorrow.
      `;
    } else if (action === 'modify') {
       if (!currentItinerary) {
         return res.status(400).json({ error: "Missing currentItinerary for modification." });
       }
      prompt = `
        You are a travel advisor. Modify this itinerary: ${JSON.stringify(currentItinerary)}
        User Request: "${request}"
        Keep the structure valid JSON.
      `;
    } else {
      return res.status(400).json({ error: "Invalid 'action'. Must be 'generate' or 'modify'." });
    }

    // 7. Execute External API Call (Gemini)
    // Wrapped in try/catch to handle Timeouts or API Errors specifically
    let response;
    try {
      response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: itinerarySchema,
        }
      });
    } catch (apiError: any) {
      console.error("Gemini API Call Failed:", apiError);
      return res.status(503).json({
        error: "AI Service Unavailable",
        details: apiError.message || "Failed to contact Google AI services."
      });
    }

    // 8. Validate AI Response
    // Safety filters might block the response, resulting in no candidates.
    if (!response || !response.candidates || response.candidates.length === 0) {
      console.warn("Gemini returned no candidates. Potential safety block.");
      return res.status(422).json({
        error: "Content Generation Blocked",
        message: "The AI was unable to generate a safe itinerary for this request."
      });
    }

    // Accessing .text might throw if the response format is unexpected
    const text = response.text;
    if (!text) {
      return res.status(500).json({
        error: "Empty Response",
        message: "The AI generated an empty response."
      });
    }

    // 9. Safe JSON Parsing
    let data;
    try {
      // Remove any markdown code fences if they exist
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw Text Received:", text);
      return res.status(500).json({
        error: "Data Formatting Error",
        message: "The AI generated invalid JSON data. Please try again."
      });
    }

    // Success
    return res.status(200).json(data);

  } catch (globalError: any) {
    // 10. Global Crash Handler
    // Catches any other synchronous errors or unhandled promises
    console.error("UNHANDLED SERVER ERROR:", globalError);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: globalError instanceof Error ? globalError.message : String(globalError) 
    });
  }
}