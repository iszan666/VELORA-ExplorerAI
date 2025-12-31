import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- SCHEMA DEFINITION ---
// Kept identical to ensure frontend compatibility
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
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: API_KEY is missing.");
      return res.status(500).json({ error: "Server Config Error", message: "API Key missing." });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, prefs, currentItinerary, request } = req.body || {};
    
    // 2. USE THE FASTEST MODEL
    // Use gemini-3-flash-preview for basic text tasks (itinerary generation) as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-flash-preview"; 

    let prompt = '';
    if (action === 'generate') {
      if (!prefs || !prefs.destination) return res.status(400).json({ error: "Missing data" });
      
      // Compact prompt to save token generation time
      prompt = `
        Create a ${prefs.duration}-day travel itinerary for ${prefs.destination}.
        Budget: ${prefs.budget}. Vibe: ${prefs.vibe}.
        Output strict JSON. No markdown.
        Activities must have real lat/lng coordinates.
      `;
    } else if (action === 'modify') {
      prompt = `
        Modify this itinerary JSON: ${JSON.stringify(currentItinerary)}
        Request: "${request}"
        Keep strict JSON structure.
      `;
    }

    // 3. GENERATE
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return res.status(200).json(data);

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: 'Generation Failed', 
      details: error.message 
    });
  }
}