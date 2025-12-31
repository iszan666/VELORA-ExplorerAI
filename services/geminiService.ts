import { TripPreferences, Itinerary } from "../types";

// --- CLIENT-SIDE SERVICE ---
// Relies on fetch('/api/itinerary') and external image APIs

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; 
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const VIBE_IMAGES = {
  Nature: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop", 
  Urban: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop", 
  Relax: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", 
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop", 
  Default: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop"
};

// --- HELPER: Aggressive Timeout ---
// Reduced to 2000ms (2 seconds) for images. 
// Speed is priority. If image is slow, show default.
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 2000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error; // Let caller handle fallback
    }
};

const getSearchQueries = (destination: string) => {
  const parts = destination.split(',').map(p => p.trim());
  const city = parts[0];
  return [`${city} tourism`, `${city} travel`];
};

const fetchUnsplashImage = async (query: string): Promise<string | null> => {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } },
      2000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch { return null; }
};

const fetchPexelsImage = async (query: string): Promise<string | null> => {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
      { headers: { Authorization: PEXELS_API_KEY } },
      2000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large2x || null;
  } catch { return null; }
};

const fetchWikipediaImage = async (destination: string): Promise<string | null> => {
  try {
    const res = await fetchWithTimeout(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destination)}`,
        {},
        2000
    );
    if (res.ok) {
      const data = await res.json();
      return data.originalimage?.source || data.thumbnail?.source || null;
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

// --- NEW EXPORT FOR LOADING SCREEN ---
export const fetchDestinationGallery = async (destination: string): Promise<string[]> => {
  const images: string[] = [];
  const query = `${destination} travel aesthetic`;

  // 1. Try Unsplash (fetch 3)
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const res = await fetchWithTimeout(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=3`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } },
        2500
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
           data.results.forEach((r: any) => {
             if (r.urls?.regular) images.push(r.urls.regular);
           });
        }
      }
    } catch (e) { /* ignore */ }
  }

  // 2. Fill with Pexels
  if (images.length < 3 && PEXELS_API_KEY) {
     try {
      const needed = 3 - images.length;
      const res = await fetchWithTimeout(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(destination)}&orientation=landscape&per_page=${needed}`,
        { headers: { Authorization: PEXELS_API_KEY } },
        2500
      );
      if (res.ok) {
        const data = await res.json();
        if (data.photos) {
           data.photos.forEach((p: any) => {
             if (p.src?.large2x) images.push(p.src.large2x);
           });
        }
      }
    } catch (e) { /* ignore */ }
  }

  // 3. Fallback to vibe defaults if completely failed
  if (images.length === 0) {
      return [VIBE_IMAGES.Nature, VIBE_IMAGES.Urban, VIBE_IMAGES.Relax];
  }

  return [...new Set(images)];
};

// --- IMAGE ENRICHMENT ---
const enrichItineraryWithImages = async (
  data: any, 
  destination: string, 
  vibe: string
): Promise<Itinerary> => {
  const vibeImage = VIBE_IMAGES[vibe as keyof typeof VIBE_IMAGES] || VIBE_IMAGES.Default;

  // 1. Fetch Day Images (Parallel but Safe)
  const enhancedDays = await Promise.all(data.days.map(async (day: any) => {
      try {
          // Try to fetch specific image, fail fast to vibe image
          const cleanTitle = day.title.replace(/[^a-zA-Z0-9 ]/g, ' ');
          const img = await fetchFromProviders(`${destination} ${cleanTitle}`);
          return { ...day, imageUrl: img || vibeImage };
      } catch (e) {
          return { ...day, imageUrl: vibeImage };
      }
  }));

  // 2. Fetch Hero Image
  let heroImage = data.heroImage;
  if (!heroImage) {
      try {
        const queries = getSearchQueries(destination);
        for (const q of queries) {
            heroImage = await fetchFromProviders(q);
            if (heroImage) break;
        }
        if (!heroImage) heroImage = await fetchWikipediaImage(destination);
      } catch (e) { /* Ignore */ }
  }
  
  return {
    ...data,
    days: enhancedDays,
    vibe: vibe,
    heroImage: heroImage || vibeImage,
    destination: destination
  } as Itinerary;
};

// --- CORE FUNCTION: GENERATE ---
export const generateItinerary = async (prefs: TripPreferences): Promise<Itinerary> => {
  const controller = new AbortController();
  // 30s max total timeout (Server + Images)
  // If server is fast (5s), we have 25s for images (capped at 2s each anyway)
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', prefs }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      // Handle Vercel 504 Gateway Timeout specifically
      if (response.status === 504) {
         throw new Error("Server timeout. Try a shorter trip duration.");
      }
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Enrich with images (client-side hotlinking)
    return await enrichItineraryWithImages(data, prefs.destination, prefs.vibe);

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Generate Error:", error);
    if (error.name === 'AbortError') throw new Error("Connection timed out.");
    throw error;
  }
};

export const modifyItinerary = async (currentItinerary: Itinerary, request: string): Promise<Itinerary> => {
  try {
    const response = await fetch('/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'modify', currentItinerary, request })
    });

    if (!response.ok) throw new Error("Modification failed");

    const newData = await response.json();
    // Re-use existing images to save time/bandwidth
    newData.heroImage = currentItinerary.heroImage;
    return newData;
  } catch (error) {
    throw error;
  }
};