import { TripPreferences, Itinerary } from "../types";

// --- CLIENT-SIDE SERVICE ---
// This file runs in the browser.
// It MUST NOT import @google/genai
// It MUST NOT use process.env.GOOGLE_API_KEY

// CONFIGURATION: IMAGE API KEYS
// These are safe to expose if restricted by domain in your dashboard, 
// or can be moved to server-side if strict security is required.
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; 
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// -------------------------------------

const VIBE_IMAGES = {
  Nature: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop", 
  Urban: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop", 
  Relax: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", 
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop", 
  Default: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop"
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

export const fetchDestinationGallery = async (destination: string): Promise<string[]> => {
  const query = `${destination} travel landmark`;
  
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

  return [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop"
  ];
};

const fetchRealLocationImage = async (destination: string, vibe: string): Promise<string> => {
  const queries = getSearchQueries(destination);
  for (const query of queries) {
    const img = await fetchFromProviders(query);
    if (img) return img;
  }
  const wikiImg = await fetchWikipediaImage(destination);
  if (wikiImg) return wikiImg;
  return VIBE_IMAGES[vibe as keyof typeof VIBE_IMAGES] || VIBE_IMAGES.Default;
};

const fetchDayImage = async (destination: string, day: any, vibe: string): Promise<string> => {
  const cleanTitle = day.title.replace(/[^a-zA-Z0-9 ]/g, ' ');
  const titleQuery = `${destination} ${cleanTitle}`;
  let img = await fetchFromProviders(titleQuery);
  if (img) return img;

  if (day.activities && day.activities.length > 0) {
      const activityQuery = `${destination} ${day.activities[0].title}`;
      img = await fetchFromProviders(activityQuery);
      if (img) return img;
  }
  return VIBE_IMAGES[vibe as keyof typeof VIBE_IMAGES] || VIBE_IMAGES.Default;
};

const enrichItineraryWithImages = async (
  data: any, 
  destination: string, 
  vibe: string
): Promise<Itinerary> => {
  const enhancedDays = await Promise.all(data.days.map(async (day: any) => {
      const img = await fetchDayImage(destination, day, vibe);
      return { ...day, imageUrl: img };
  }));

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

// --- CORE FUNCTION: GENERATE ---
// This calls the Vercel Serverless Function via fetch.
// It DOES NOT use the Google SDK directly.
export const generateItinerary = async (prefs: TripPreferences): Promise<Itinerary> => {
  try {
    const heroImagePromise = fetchRealLocationImage(prefs.destination, prefs.vibe);

    // Call /api/itinerary (Relative path works automatically in Vercel)
    const response = await fetch('/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        prefs
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const heroImage = await heroImagePromise;
    data.heroImage = heroImage;
    
    return await enrichItineraryWithImages(data, prefs.destination, prefs.vibe);

  } catch (error) {
    console.error("Itinerary Generation Error:", error);
    throw error;
  }
};

// --- CORE FUNCTION: MODIFY ---
export const modifyItinerary = async (currentItinerary: Itinerary, request: string): Promise<Itinerary> => {
  try {
    const response = await fetch('/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'modify',
        currentItinerary,
        request
      })
    });

    if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Server error: ${response.status} ${errorText}`);
    }

    const newData = await response.json();
    return await enrichItineraryWithImages(newData, currentItinerary.destination || "", currentItinerary.vibe || "Nature");

  } catch (error) {
    console.error("Modification Error:", error);
    throw error;
  }
};