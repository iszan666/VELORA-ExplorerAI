import React, { useState, useEffect, useRef } from 'react';
import { TripPreferences } from '../types';

interface TripFormProps {
  onSubmit: (prefs: TripPreferences) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

const TripForm: React.FC<TripFormProps> = ({ onSubmit }) => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(5);
  const [budget, setBudget] = useState<'$' | '$$' | '$$$'>('$$');
  const [vibe, setVibe] = useState<'Nature' | 'Urban' | 'Relax' | 'Food'>('Nature');

  // Search state
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination.length > 2 && showDropdown) {
        searchLocation(destination);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [destination, showDropdown]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocation = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'VeloraExplorer/1.0' // Required by Nominatim
          }
        }
      );
      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Nominatim search failed:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: NominatimResult) => {
    // Construct a cleaner name if possible, otherwise use full display name
    // Prefer: City, Country or Town, Country
    let cleanName = result.display_name;
    
    // Simple logic to try and shorten the very long OSM names
    const parts = result.display_name.split(', ');
    if (parts.length > 2) {
       cleanName = `${parts[0]}, ${parts[parts.length - 1]}`;
    }

    setDestination(cleanName);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    setShowDropdown(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    onSubmit({ destination, duration, budget, vibe });
  };

  const vibes = [
    { id: 'Nature', icon: 'landscape' },
    { id: 'Urban', icon: 'location_city' },
    { id: 'Relax', icon: 'self_improvement' },
    { id: 'Food', icon: 'restaurant' },
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-dark/60 backdrop-blur-xl p-5 shadow-2xl ring-1 ring-white/5">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-[60px] pointer-events-none"></div>
      
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Destination Input */}
        <div className="space-y-2 relative" ref={wrapperRef}>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 pl-1">Destination</label>
          <div className="group relative flex items-center">
            <div className="absolute left-4 flex items-center pointer-events-none text-primary">
              <span className="material-symbols-outlined text-[20px]">
                {isSearching ? 'sync' : 'search'}
              </span>
            </div>
            <input
              className={`w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-gray-500 transition-all focus:border-primary focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary ${isSearching ? 'animate-pulse' : ''}`}
              placeholder="Search cities (e.g. Tokyo, Paris)..."
              type="text"
              value={destination}
              onChange={handleInputChange}
              onFocus={() => destination.length > 1 && setShowDropdown(true)}
              required
              autoComplete="off"
            />
          </div>

          {/* Custom Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-xl border border-white/10 bg-[#1c2e24] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
               <ul className="max-h-60 overflow-y-auto no-scrollbar py-2">
                 {suggestions.map((item) => (
                   <li 
                     key={item.place_id}
                     onClick={() => handleSelectLocation(item)}
                     className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-start gap-3 transition-colors border-b border-white/5 last:border-0"
                   >
                     <span className="material-symbols-outlined text-gray-400 text-[18px] mt-0.5 shrink-0">public</span>
                     <div>
                       <p className="text-sm text-white font-medium line-clamp-1">{item.display_name.split(',')[0]}</p>
                       <p className="text-xs text-gray-400 line-clamp-1">{item.display_name}</p>
                     </div>
                   </li>
                 ))}
               </ul>
               <div className="bg-white/5 px-4 py-1.5 flex justify-end">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    Powered by OpenStreetMap
                  </span>
               </div>
            </div>
          )}
        </div>

        {/* Duration Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pl-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Duration</label>
            <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded text-center min-w-[3rem]">{duration} days</span>
          </div>
          <div className="px-1 py-2">
            <input
              className="w-full h-1 bg-surface-dark rounded-lg appearance-none cursor-pointer"
              max="14"
              min="1"
              type="range"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-medium">
              <span>1 Day</span>
              <span>2 Weeks</span>
            </div>
          </div>
        </div>

        {/* Budget Segmented Control */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 pl-1">Budget</label>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/5 p-1 border border-white/5">
            {(['$', '$$', '$$$'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBudget(b)}
                className={`rounded-lg py-2.5 text-sm font-medium transition-all ${
                  budget === b
                    ? 'bg-surface-dark text-white shadow-sm ring-1 ring-white/10 font-bold'
                    : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Style Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 pl-1">Vibe</label>
          <div className="grid grid-cols-4 gap-2">
            {vibes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVibe(v.id)}
                className={`group flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all ${
                  vibe === v.id
                    ? 'border border-primary/50 bg-primary/10'
                    : 'border border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${vibe === v.id ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
                  {v.icon}
                </span>
                <span className={`text-[10px] font-medium ${vibe === v.id ? 'text-white font-semibold' : 'text-gray-400 group-hover:text-white'}`}>
                  {v.id}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="submit"
          className="relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary py-4 text-base font-bold text-background-dark shadow-lg shadow-primary/25 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!destination}
        >
          <span className="z-10">Generate Itinerary</span>
          <span className="material-symbols-outlined z-10 text-[20px] font-bold">auto_awesome</span>
          {/* Button shine effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>
      </form>
    </div>
  );
};

export default TripForm;