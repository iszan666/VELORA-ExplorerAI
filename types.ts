export interface TripPreferences {
  destination: string;
  duration: number;
  budget: '$' | '$$' | '$$$';
  vibe: 'Nature' | 'Urban' | 'Relax' | 'Food';
}

export interface Activity {
  time: string;
  title: string;
  desc: string;
  icon: string; // e.g., 'flight_land', 'restaurant', 'hiking'
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DayPlan {
  day: number;
  date: string; // e.g., "Oct 12"
  title: string;
  costEstimate: string; // e.g., "~$150"
  imageUrl?: string;
  activities: Activity[];
}

export interface Itinerary {
  id: string;
  tripTitle: string;
  dateRange: string;
  totalBudget: string;
  weather: string;
  currencyRate: string;
  days: DayPlan[];
  localTips: string[];
  packingList: string[];
  vibe?: string;
  heroImage?: string; // Real-world location image URL
}

export type AppView = 'HOME' | 'SAVED' | 'TRIPS' | 'PROFILE' | 'ITINERARY_DETAILS';
export type GenerationState = 'IDLE' | 'LOADING' | 'ERROR';