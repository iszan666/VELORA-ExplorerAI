import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TripPreferences, Itinerary, DayPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CONFIGURATION: IMAGE API KEYS ---
// To make the images "real", paste your API keys inside the quotes below.
// If you leave these blank, the app will fallback to Wikipedia (free) or generic images.

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "PkfwOUNXL239BcQnXVlQ648ZmYIpzIzEtk9eQC0hBOQ"; 
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "CWQEpRvcOTu7VoxRrXd7cL37GDxkDtf6Vo43q1ye1iSjLxRf8MNyfhC4";

// -------------------------------------

const VIBE_IMAGES = {
  Nature: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop", 
  Urban: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop", 
  Relax: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", 
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop", 
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

// --- Image Provider Helpers ---

const getSearchQueries = (destination: string) => {
  const parts = destination.split(',').map(p => p.trim());
  const city = parts[0];
  const country = parts.length > 1 ? parts[parts.length - 1] : city;

  return [
    destination,                       // 1. City + Country
    `${city} landmark skyline`,        // 2. City landmark
    `${country} travel scenery`        // 3. Country travel
  ];
};

const fetchUnsplashImage = async (query: string): Promise<string | null> => {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&content_filter=high`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch { return null; }
};

const fetchPexelsImage = async (query: string): Promise<string | null> => {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large2x || null;
  } catch { return null; }
};

const fetchWikipediaImage = async (destination: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destination)}`);
    if (res.ok) {
      const data = await res.json();
      return data.originalimage?.source || data.thumbnail?.source || null;
    }
    const city = destination.split(',')[0].trim();
    if (city !== destination) {
       const resCity = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`);
       if (resCity.ok) {
          const data = await resCity.json();
          return data.originalimage?.source || data.thumbnail?.source || null;
       }
    }
    return null;
  } catch { return null; }
};

// Generic helper to try providers in order
const fetchFromProviders = async (query: string): Promise<string | null> => {
  if (UNSPLASH_ACCESS_KEY) {
    const img = await fetchUnsplashImage(query);
    if (img) return img;
  }
  if (PEXELS_API_KEY) {
    const img = await fetchPexelsImage(query);
    if (img) return img;
  }
  return null;
};

/**
 * Fetches a gallery of images for the loading screen
 */
export const fetchDestinationGallery = async (destination: string): Promise<string[]> => {
  const query = `${destination} travel landmark`;
  
  // Try Unsplash
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=8&content_filter=high`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
           return data.results.map((r: any) => r.urls.regular);
        }
      }
    } catch (e) { console.error("Unsplash Gallery Error", e); }
  }

  // Try Pexels
  if (PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=8`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
            return data.photos.map((p: any) => p.src.large2x);
        }
      }
    } catch (e) { console.error("Pexels Gallery Error", e); }
  }

  // Fallback defaults
  return [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop"
  ];
};

/**
 * Fetches the Hero Image using multiple robust queries
 */
const fetchRealLocationImage = async (destination: string, vibe: string): Promise<string> => {
  const queries = getSearchQueries(destination);

  // Try providers with robust queries
  for (const query of queries) {
    const img = await fetchFromProviders(query);
    if (img) return img;
  }

  // Try Wikipedia
  const wikiImg = await fetchWikipediaImage(destination);
  if (wikiImg) return wikiImg;

  // Fallback
  return VIBE_IMAGES[vibe as keyof typeof VIBE_IMAGES] || VIBE_IMAGES.Default;
};

/**
 * Fetches a specific image for a Day Plan
 */
const fetchDayImage = async (destination: string, day: any, vibe: string): Promise<string> => {
  // 1. Try: Destination + Day Title (e.g. "Tokyo Shibuya Crossing")
  const cleanTitle = day.title.replace(/[^a-zA-Z0-9 ]/g, ' ');
  const titleQuery = `${destination} ${cleanTitle}`;
  let img = await fetchFromProviders(titleQuery);
  if (img) return img;

  // 2. Try: Destination + First Activity (e.g. "Tokyo Meiji Shrine")
  if (day.activities && day.activities.length > 0) {
      const activityQuery = `${destination} ${day.activities[0].title}`;
      img = await fetchFromProviders(activityQuery);
      if (img) return img;
  }

  // 3. Fallback to Vibe (we return null here so the UI can decide or we return vibe here)
  return VIBE_IMAGES[vibe as keyof typeof VIBE_IMAGES] || VIBE_IMAGES.Default;
};

/**
 * Enriches a raw itinerary with real images
 */
const enrichItineraryWithImages = async (
  data: any, 
  destination: string, 
  vibe: string
): Promise<Itinerary> => {
  // Process days to fetch real images for each day in parallel
  const enhancedDays = await Promise.all(data.days.map(async (day: any) => {
      // Re-use existing image if it's already a real URL (not a placeholder logic) 
      // AND title hasn't changed drastically? 
      // For simplicity, we re-fetch to ensure match with new titles if changed.
      const img = await fetchDayImage(destination, day, vibe);
      return { ...day, imageUrl: img };
  }));

  // Fetch Hero Image if missing
  let heroImage = data.heroImage;
  if (!heroImage) {
      heroImage = await fetchRealLocationImage(destination, vibe);
  }
  
  return {
    ...data,
    days: enhancedDays,
    vibe: vibe,
    heroImage: heroImage,
    destination: destination
  } as Itinerary;
};

export const generateItinerary = async (prefs: TripPreferences): Promise<Itinerary> => {
  try {
    const model = "gemini-3-flash-preview"; 
    
    // Start fetching the Hero image in parallel with the AI request
    const heroImagePromise = fetchRealLocationImage(prefs.destination, prefs.vibe);

    const prompt = `
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
    const heroImage = await heroImagePromise;
    data.heroImage = heroImage;
    
    return await enrichItineraryWithImages(data, prefs.destination, prefs.vibe);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Modifies an existing itinerary based on user instructions.
 * Performs partial regeneration.
 */
export const modifyItinerary = async (currentItinerary: Itinerary, request: string): Promise<Itinerary> => {
  try {
    const model = "gemini-3-flash-preview";

    const prompt = `
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
    if (!text) throw new Error("No response from AI during modification");

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const newData = JSON.parse(cleanedText);

    // Re-run image enrichment to ensure any *new* activities get appropriate photos
    return await enrichItineraryWithImages(newData, currentItinerary.destination || "", currentItinerary.vibe || "Nature");

  } catch (error) {
    console.error("Gemini Modification Error:", error);
    throw error;
  }
};