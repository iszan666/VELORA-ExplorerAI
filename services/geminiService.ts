import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TripPreferences, Itinerary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// High-quality Unsplash fallbacks based on Vibe if specific location image fails
const VIBE_IMAGES = {
  Nature: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop", // Landscape
  Urban: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop", // City
  Relax: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", // Beach/Relax
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop", // Food
  Default: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop"
};

const itinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tripTitle: { type: Type.STRING, description: "Title of the trip, e.g., 'Trip to Bali'" },
    dateRange: { type: Type.STRING, description: "Simulated date range, e.g., 'Oct 12 - Oct 24'" },
    totalBudget: { type: Type.STRING, description: "Estimated total cost" },
    weather: { type: Type.STRING, description: "Expected weather summary, e.g. '28°C, Sunny'" },
    currencyRate: { type: Type.STRING, description: "Exchange rate info, e.g., '1 USD = 15,450 IDR'" },
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
  required: ["tripTitle", "dateRange", "totalBudget", "weather", "days", "localTips", "packingList"]
};

/**
 * Fetches a real-world image for the destination using the Wikimedia Summary API.
 * This is robust, free, and returns specific location photos.
 */
const fetchLocationImage = async (destination: string, vibe: string): Promise<string> => {
  try {
    // Attempt to get a specific image for the city/location
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destination)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.originalimage?.source) {
        return data.originalimage.source;
      }
      if (data.thumbnail?.source) {
        // Force higher res if possible by manipulating URL, otherwise just return thumbnail
        return data.thumbnail.source;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch location image, falling back to vibe.", e);
  }

  // Fallback to Vibe-based high-quality Unsplash image
  return VIBE_IMAGES[vibe as keyof typeof VIBE_IMAGES] || VIBE_IMAGES.Default;
};

export const generateItinerary = async (prefs: TripPreferences): Promise<Itinerary> => {
  try {
    const model = "gemini-3-flash-preview"; 
    
    // Start fetching the image in parallel with the AI request
    const imagePromise = fetchLocationImage(prefs.destination, prefs.vibe);

    const prompt = `
      Curate a bespoke travel itinerary for ${prefs.destination}.
      
      **Trip Parameters:**
      - Duration: ${prefs.duration} days.
      - Budget: ${prefs.budget} (Scale: $ Economy to $$$ Luxury).
      - Vibe: ${prefs.vibe}.

      **Style Guide:**
      - **Tone:** Elegant, professional, and inspiring. Use sophisticated language (e.g., "Embark," "Savor," "Discover").
      - **Structure:** Each day MUST have exactly three activities labeled strictly as 'Morning', 'Afternoon', and 'Evening'.
      - **Descriptions:** Short, refined, and impactful. Focus on the unique atmosphere and key experience. Avoid generic filler words.

      **Requirements:**
      1. Generate a valid JSON response based on the schema.
      2. Ensure icons are valid Material Symbols Outlined names (snake_case).
      3. **Crucial:** Provide realistic GPS coordinates (lat, lng) for every activity for map plotting.
      4. Make the content highly specific to ${prefs.destination}.
      5. Assume the trip starts tomorrow.
    `;

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

    // Robust JSON parsing
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);
    
    // Await the real image
    const heroImage = await imagePromise;
    
    // Inject ID, vibe, and the fetched real-world image
    return {
        ...data,
        id: crypto.randomUUID(),
        vibe: prefs.vibe,
        heroImage: heroImage
    } as Itinerary;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};