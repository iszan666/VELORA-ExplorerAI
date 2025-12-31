import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- SERVER-SIDE CONFIGURATION ---
// This file runs in a secure Node.js environment on Vercel.
// It is the ONLY place authorized to use the Google GenAI SDK.
const apiKey = process.env.GOOGLE_API_KEY;

// Fail fast on server start if key is missing (logs to Vercel dashboard)
if (!apiKey) {
  console.error("CRITICAL ERROR: GOOGLE_API_KEY is missing in Vercel Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Schema Definition (kept identical to ensure consistent JSON)
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
  // CORS Handling for local dev vs production
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Double check key at request time to send helpful error to client
  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ 
      error: "Configuration Error", 
      message: "Server missing API Key. Please set GOOGLE_API_KEY in Vercel." 
    });
  }

  const { action, prefs, currentItinerary, request } = req.body;
  const model = "gemini-2.5-flash-002"; 

  try {
    let prompt = '';

    if (action === 'generate') {
      prompt = `
        Curate a bespoke travel itinerary for ${prefs.destination}.
        Duration: ${prefs.duration} days. Budget: ${prefs.budget}. Vibe: ${prefs.vibe}.
        Return strictly JSON matching the provided schema.
        Ensure every activity has realistic latitude/longitude coordinates.
        Assume trip starts tomorrow.
      `;
    } else if (action === 'modify') {
      prompt = `
        You are a travel advisor. Modify this itinerary: ${JSON.stringify(currentItinerary)}
        User Request: "${request}"
        Keep the structure valid JSON.
      `;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return res.status(200).json(data);

  } catch (error) {
    console.error("Server API Error:", error);
    return res.status(500).json({ 
      error: 'Generation Failed', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}