import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize with the server-side environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Define Schema (Moved from frontend)
const itinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tripTitle: { type: Type.STRING, description: "Title of the trip, e.g., 'Trip to Bali'" },
    dateRange: { type: Type.STRING, description: "Simulated date range, e.g., 'Oct 12 - Oct 24'" },
    totalBudget: { type: Type.STRING, description: "Estimated total cost" },
    weather: { type: Type.STRING, description: "Expected weather summary, e.g. '28°C, Sunny'" },
    currencyRate: { type: Type.STRING, description: "Exchange rate info, e.g., '1 USD = 15,450 IDR'" },
    whyDestination: { 
      type: Type.STRING, 
      description: "A professional, personalized explanation (3-4 sentences) of why this destination fits the user's duration, budget, and vibe." 
    },
    localTips: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "2-3 short, essential local tips"
    },
    packingList: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-4 essential packing items"
    },
    budgetAssumption: {
      type: Type.STRING,
      description: "A professional paragraph explaining the mid-range budget assumptions and disclaimer about variable costs."
    },
    localContext: {
      type: Type.OBJECT,
      description: "Cultural context including food, customs, and etiquette",
      properties: {
        foodAndDrinks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2-3 well-known local foods or drinks"
        },
        customs: {
          type: Type.STRING,
          description: "Brief explanation of cultural habits or daily customs (1-2 sentences)"
        },
        etiquetteTips: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Short practical travel etiquette tips"
        }
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
          title: { type: Type.STRING, description: "Main theme of the day" },
          costEstimate: { type: Type.STRING, description: "Cost for this day" },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING, description: "Strictly 'Morning', 'Afternoon', or 'Evening'" },
                title: { type: Type.STRING },
                desc: { type: Type.STRING, description: "A refined, professional description (1-2 sentences)" },
                icon: { type: Type.STRING, description: "Material symbol name (e.g. restaurant, hiking, museum)" },
                coordinates: {
                  type: Type.OBJECT,
                  description: "Coordinates of the activity location",
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                  },
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, prefs, currentItinerary, request } = req.body;
  const model = "gemini-3-flash-preview";

  try {
    let prompt = '';

    if (action === 'generate') {
      prompt = `
        Curate a bespoke travel itinerary for ${prefs.destination}.
        
        **Trip Parameters:**
        - Duration: ${prefs.duration} days.
        - Budget: ${prefs.budget} (Scale: $ Economy to $$$ Luxury).
        - Vibe: ${prefs.vibe}.

        **Style Guide:**
        - **Tone:** Elegant, professional, and inspiring. Use sophisticated language.
        - **Structure:** Each day MUST have exactly three activities labeled 'Morning', 'Afternoon', and 'Evening'.
        - **Descriptions:** Short, refined, and impactful.
        - **Budget Section:** Include a short "Budget Assumption" section. Write it in a professional, calm travel-advisor tone. Assume a mid-range travel style that includes:
           - Comfortable 3-star accommodation
           - Public transportation or standard ride services
           - Regular dining at local restaurants
           Clearly state that the budget provided is an estimate, not a fixed price, and that actual costs may vary depending on travel season, availability, personal preferences, and destination conditions.
        - **Local Context:** Include a section for local context.
           - **Food:** 2–3 genuine local foods or drinks.
           - **Customs:** Brief explanation of habits/daily customs (1-2 sentences).
           - **Etiquette:** Short, practical etiquette tips.
           - **Tone:** Calm, professional, factual. No stereotypes.
        - **Advisor Note:** Include a section titled "Why This Destination Works for You".
           - Explain why it fits the ${prefs.duration}-day timeframe, ${prefs.budget} budget, and ${prefs.vibe} vibe.
           - Mention accessibility/ease of travel.
           - Tone: Professional, reassuring, no marketing fluff. 3-4 sentences max.

        **Requirements:**
        1. Generate a valid JSON response based on the schema.
        2. Ensure icons are valid Material Symbols Outlined names (snake_case).
        3. **Crucial:** Provide realistic GPS coordinates (lat, lng) for every activity.
        4. Make the content highly specific to ${prefs.destination}.
        5. Assume the trip starts tomorrow.
      `;
    } else if (action === 'modify') {
      prompt = `
        You are a professional travel advisor refining an existing travel itinerary for ${currentItinerary.destination || currentItinerary.tripTitle}.
        
        **Current Itinerary JSON:**
        ${JSON.stringify(currentItinerary)}

        **User Request:**
        "${request}"

        **Instructions:**
        1. Update the JSON to strictly fulfill the user's request (e.g., change activities, update vibe, adjust pacing).
        2. **PRESERVE** the existing destination, trip duration, and budget level unless explicitly asked to change.
        3. **PRESERVE** unmodified sections exactly as they are. Do not rewrite descriptions unless necessary.
        4. Maintain the original professional, elegant tone.
        5. Ensure strictly valid JSON output matching the original schema.
        6. If changing activities, provide new realistic GPS coordinates and icons.
        7. Update the "Why This Destination Works for You" section only if the changes significantly alter the trip's nature.

        **Goal:**
        Make the user feel heard by making thoughtful, specific adjustments without disrupting the parts of the plan they didn't complain about.
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
        temperature: 0.6
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return res.status(200).json(data);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: 'Failed to generate content', details: error instanceof Error ? error.message : String(error) });
  }
}