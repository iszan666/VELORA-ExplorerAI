import React, { useState, useEffect, useMemo } from 'react';
import { Itinerary, DayPlan, AppView } from '../types';
import ItineraryMap from './ItineraryMap';

interface ItineraryDisplayProps {
  data: Itinerary;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: (itinerary: Itinerary) => void;
  onNavigate: (view: AppView) => void;
}

interface DayCardProps {
  day: DayPlan;
  isExpanded: boolean;
  onToggle: (dayNum: number) => void;
  vibe?: string;
}

const DayCard: React.FC<DayCardProps> = ({ day, isExpanded, onToggle, vibe }) => {
  // Use the fetched specific image, or fallback to vibe-based generic
  const getVibeImage = () => {
     switch(vibe) {
        case 'Urban': return "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1920&auto=format&fit=crop";
        case 'Nature': return "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop";
        case 'Food': return "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop";
        default: return "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1886&auto=format&fit=crop";
     }
  };
  
  // Prefer the specific image URL found via Unsplash/Pexels API
  const bgImage = day.imageUrl || getVibeImage();

  if (isExpanded) {
    return (
      <article className="glass-card rounded-2xl overflow-hidden shadow-lg shadow-black/20 group animate-in fade-in slide-in-from-bottom-4 duration-500 mb-4">
        <div className="relative h-48 w-full cursor-pointer" onClick={() => onToggle(day.day)}>
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" style={{ backgroundImage: `url('${bgImage}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#161f1a] to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-background-dark uppercase tracking-wide">Day {day.day}</span>
                <span className="text-gray-300 text-xs">{day.date}</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-md">{day.title}</h2>
            </div>
            <div className="text-right">
              <p className="text-primary font-bold drop-shadow-sm">{day.costEstimate}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-[24px_1fr] gap-x-5">
            {day.activities.map((activity, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-1 pt-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 z-10">
                    <span className="material-symbols-outlined text-[14px] text-primary">{activity.icon}</span>
                  </div>
                  {idx < day.activities.length - 1 && <div className="w-[1px] bg-white/10 h-full grow min-h-[40px]"></div>}
                </div>
                <div className="flex flex-col pb-8 pt-1">
                  <span className="text-primary/90 text-[10px] font-bold uppercase tracking-widest mb-1">{activity.time}</span>
                  <h3 className="text-white text-base font-bold leading-tight">{activity.title}</h3>
                  <p className="text-gray-400 text-sm mt-1.5 font-light leading-relaxed">{activity.desc}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-2 pt-4 border-t border-white/5 flex flex-wrap gap-2">
              <button className="flex items-center gap-2 h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-primary">map</span>
                  View Route
              </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article onClick={() => onToggle(day.day)} className="glass-card rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-transform duration-200 mb-3 cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 shadow-inner" style={{ backgroundImage: `url('${bgImage}')` }}></div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-xs uppercase">Day {day.day}</span>
            <span className="text-gray-500 text-xs">• {day.date}</span>
          </div>
          <h3 className="text-white font-semibold text-sm line-clamp-1">{day.title}</h3>
        </div>
      </div>
      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-white/10 transition-colors">
        <span className="material-symbols-outlined">expand_more</span>
      </button>
    </article>
  );
};

const CURRENCY_RATES: Record<string, number> = {
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 150.0,
    'CAD': 1.36,
    'AUD': 1.52,
    'INR': 83.50,
    'CNY': 7.23,
    'CHF': 0.90,
    'MXN': 17.10
  };

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ data, onBack, isSaved, onToggleSave, onNavigate }) => {
  const [expandedDay, setExpandedDay] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isMapMounted, setIsMapMounted] = useState(false);

  // Currency Converter State
  const [showConverter, setShowConverter] = useState(false);
  const [convertAmount, setConvertAmount] = useState<string>('');
  const [targetCurrency, setTargetCurrency] = useState('EUR');

  useEffect(() => {
    // This ensures the map only loads on the client side, 
    // mimicking Next.js dynamic import { ssr: false }
    setIsMapMounted(true);
  }, []);

  useEffect(() => {
    if (data.totalBudget) {
        // Simple extraction of the first numeric sequence
        const match = data.totalBudget.match(/[\d,]+/);
        if (match) {
            setConvertAmount(match[0].replace(/,/g, ''));
        }
    }
  }, [data]);

  const toggleDay = (dayNum: number) => {
    if (expandedDay === dayNum) {
      setExpandedDay(0); // Collapse if clicking active
    } else {
      setExpandedDay(dayNum);
    }
  };

  const convertedValue = useMemo(() => {
    const val = parseFloat(convertAmount);
    if (isNaN(val)) return '---';
    const rate = CURRENCY_RATES[targetCurrency];
    return (val * rate).toLocaleString(undefined, { 
        style: 'currency', 
        currency: targetCurrency 
    });
  }, [convertAmount, targetCurrency]);

  const handleFlightSearch = () => {
    // Construct a search query for Google Flights
    // Use destination if available, otherwise fallback to tripTitle
    const destinationName = data.destination || data.tripTitle.replace('Trip to ', '').replace('Itinerary', '').trim();
    // Include date range in the query to help the search engine (e.g. "Flights to Bali Oct 12 - Oct 24")
    const query = `Flights to ${destinationName} ${data.dateRange}`;
    window.open(`https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-dark">
      
      {/* Dynamic Location Hero Background */}
      <div className="absolute top-0 left-0 w-full h-[320px] z-0">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" 
               style={{ backgroundImage: `url('${data.heroImage || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074"}')` }}>
          </div>
          {/* Elegant Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background-dark/40 to-background-dark"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="flex flex-col items-center opacity-0 animate-[fade-in_0.5s_ease-out_forwards] [animation-delay:300ms]">
             {/* Title fades in when scrolling? Kept simple for now */}
        </div>
        <button 
            onClick={() => onToggleSave(data)}
            className={`flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors ${isSaved ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined ${isSaved ? 'filled' : ''}`}>favorite</span>
        </button>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 px-6 pt-4 pb-2 text-center">
         <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-2">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{data.days.length} Days • {data.vibe} Vibe</span>
         </div>
         <h1 className="text-3xl font-black text-white leading-tight tracking-tight drop-shadow-lg mb-1">{data.tripTitle}</h1>
         <p className="text-gray-200 text-sm font-medium drop-shadow-md flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            {data.dateRange}
         </p>
      </div>

      {/* View Toggle */}
      <div className="px-6 pt-6 pb-2 z-10">
        <div className="flex p-1 bg-surface-dark/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg">
            <button 
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-primary text-background-dark shadow-sm font-bold' : 'text-gray-400 hover:text-white'}`}
            >
                <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                List
            </button>
            <button 
                onClick={() => setViewMode('map')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-primary text-background-dark shadow-sm font-bold' : 'text-gray-400 hover:text-white'}`}
            >
                <span className="material-symbols-outlined text-[18px]">map</span>
                Map
            </button>
        </div>
      </div>

      <main className={`flex-1 px-4 py-4 relative z-0 pb-24 h-full flex flex-col ${viewMode === 'list' ? 'space-y-6' : ''}`}>
        {viewMode === 'list' ? (
            <>
                {/* Stats */}
                <section className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                    <div className="glass-card min-w-[140px] p-4 rounded-xl flex flex-col gap-2 snap-start">
                        <div className="flex items-center gap-2 text-primary/80">
                        <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                        <span className="text-xs font-semibold uppercase tracking-wider">Budget</span>
                        </div>
                        <div>
                        <p className="text-white text-xl font-bold">{data.totalBudget}</p>
                        <p className="text-gray-400 text-xs">Est. Total Cost</p>
                        </div>
                    </div>
                    <div className="glass-card min-w-[140px] p-4 rounded-xl flex flex-col gap-2 snap-start">
                        <div className="flex items-center gap-2 text-yellow-400/80">
                        <span className="material-symbols-outlined text-xl">sunny</span>
                        <span className="text-xs font-semibold uppercase tracking-wider">Weather</span>
                        </div>
                        <div>
                        <p className="text-white text-xl font-bold">{data.weather.split(',')[0]}</p>
                        <p className="text-gray-400 text-xs line-clamp-1">{data.weather}</p>
                        </div>
                    </div>
                    
                    {/* Flights Button */}
                     <div 
                        onClick={handleFlightSearch}
                        className="glass-card min-w-[140px] p-4 rounded-xl flex flex-col gap-2 snap-start cursor-pointer hover:bg-white/5 active:scale-95 transition-all group border-emerald-400/20"
                    >
                        <div className="flex items-center gap-2 text-emerald-400/80">
                        <span className="material-symbols-outlined text-xl group-hover:-rotate-45 transition-transform duration-500">flight_takeoff</span>
                        <span className="text-xs font-semibold uppercase tracking-wider">Travel</span>
                        </div>
                        <div>
                        <p className="text-white text-lg font-bold line-clamp-1 group-hover:text-emerald-400 transition-colors">Find Flights</p>
                        <p className="text-gray-400 text-xs">Check availability</p>
                        </div>
                    </div>

                    {/* Clickable Rate Card triggering Converter */}
                    <div 
                        onClick={() => setShowConverter(true)}
                        className="glass-card min-w-[140px] p-4 rounded-xl flex flex-col gap-2 snap-start cursor-pointer hover:bg-white/5 active:scale-95 transition-all group border-blue-400/20"
                    >
                        <div className="flex items-center gap-2 text-blue-400/80">
                        <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-500">currency_exchange</span>
                        <span className="text-xs font-semibold uppercase tracking-wider">Rate</span>
                        </div>
                        <div>
                        <p className="text-white text-lg font-bold line-clamp-1 group-hover:text-blue-400 transition-colors">Convert</p>
                        <p className="text-gray-400 text-xs">Tap to calculate</p>
                        </div>
                    </div>
                </section>

                {/* Advisor's Note / Why This Destination */}
                {data.whyDestination && (
                    <div className="glass-card p-4 rounded-xl border-l-4 border-l-primary mb-2">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="material-symbols-outlined text-primary text-lg">verified</span>
                             <h4 className="font-bold text-sm text-white">Advisor's Insight</h4>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed italic">
                            "{data.whyDestination}"
                        </p>
                    </div>
                )}

                {/* Days */}
                <section>
                {data.days.map(day => (
                    <DayCard 
                    key={day.day} 
                    day={day} 
                    isExpanded={expandedDay === day.day}
                    onToggle={toggleDay}
                    vibe={data.vibe}
                    />
                ))}
                </section>

                {/* Essentials */}
                <section className="pt-4 pb-8">
                <h3 className="text-lg font-bold text-white mb-3 px-1">Essentials</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="glass-card p-4 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-purple-400">lightbulb</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">Local Tips</h4>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">
                        {data.localTips.join(' ')}
                    </p>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-orange-400">backpack</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">Packing List</h4>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">
                        {data.packingList.join(', ')}
                    </p>
                    </div>
                </div>
                
                {/* Local Context Card */}
                {data.localContext && (
                    <div className="glass-card p-4 rounded-xl mb-3">
                        <div className="flex items-center gap-2 mb-3 text-amber-400">
                            <span className="material-symbols-outlined text-lg">public</span>
                            <h4 className="font-semibold text-sm">Local Context</h4>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">restaurant_menu</span>
                                Culinary Staples
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {data.localContext.foodAndDrinks.map((item, i) => (
                                        <span key={i} className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300 border border-white/5">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">diversity_3</span>
                                Culture & Customs
                                </h5>
                                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                                    {data.localContext.customs}
                                </p>
                            </div>
                            
                            <div>
                                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">handshake</span>
                                Etiquette
                                </h5>
                                <ul className="text-xs text-gray-400 leading-relaxed list-disc list-inside marker:text-primary">
                                    {data.localContext.etiquetteTips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Budget Assumption Card */}
                {data.budgetAssumption && (
                    <div className="glass-card p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-emerald-400">
                             <span className="material-symbols-outlined text-lg">payments</span>
                             <h4 className="font-semibold text-sm">Budget Note</h4>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {data.budgetAssumption}
                        </p>
                    </div>
                )}
                </section>
            </>
        ) : (
            <div className="flex-1 w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl">
                {isMapMounted ? (
                    <ItineraryMap data={data} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-dark">
                        <span className="text-gray-400 text-sm">Loading Map...</span>
                    </div>
                )}
            </div>
        )}
      </main>

       {/* Bottom Navigation */}
       <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-surface-glass-border px-6 py-3 pb-6 z-50 max-w-md mx-auto">
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => onNavigate('HOME')}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">home</span>
                    <span className="text-[10px] font-medium">Home</span>
                </button>
                <button 
                     className="flex flex-col items-center gap-1 text-primary cursor-default"
                >
                    <span className="material-symbols-outlined filled">map</span>
                    <span className="text-[10px] font-medium">Current</span>
                </button>
                <button 
                    onClick={() => onNavigate('SAVED')}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">favorite</span>
                    <span className="text-[10px] font-medium">Saved</span>
                </button>
                <button 
                    onClick={() => onNavigate('PROFILE')}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">person</span>
                    <span className="text-[10px] font-medium">Profile</span>
                </button>
            </div>
        </nav>

        {/* Currency Converter Modal */}
        {showConverter && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-xs bg-[#161f1a] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                    <button 
                        onClick={() => setShowConverter(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-400 text-sm">currency_exchange</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">Converter</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (USD)</label>
                            <input 
                                type="number" 
                                value={convertAmount}
                                onChange={(e) => setConvertAmount(e.target.value)}
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-mono"
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">To Currency</label>
                            <select 
                                value={targetCurrency}
                                onChange={(e) => setTargetCurrency(e.target.value)}
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all appearance-none"
                            >
                                {Object.keys(CURRENCY_RATES).map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 border-t border-white/5 mt-4">
                            <div className="text-center">
                                <span className="text-xs text-gray-500 font-medium">Approximation</span>
                                <div className="text-3xl font-bold text-white mt-1">{convertedValue}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ItineraryDisplay;