import React, { useState, useEffect } from 'react';
import TripForm from './components/TripForm';
import LoadingScreen from './components/LoadingScreen';
import ItineraryDisplay from './components/ItineraryDisplay';
import ErrorScreen from './components/ErrorScreen';
import SavedTripsList from './components/SavedTripsList';
import Profile from './components/Profile';
import { generateItinerary } from './services/geminiService';
import { TripPreferences, Itinerary, AppView, GenerationState } from './types';

const App: React.FC = () => {
  // Navigation & Generation State
  const [view, setView] = useState<AppView>('HOME');
  const [genState, setGenState] = useState<GenerationState>('IDLE');
  
  // Data State
  const [currentPreferences, setCurrentPreferences] = useState<TripPreferences | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const [tripHistory, setTripHistory] = useState<Itinerary[]>([]);

  // Load persistence on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_travel_saved');
    const history = localStorage.getItem('ai_travel_history');
    if (saved) setSavedItineraries(JSON.parse(saved));
    if (history) setTripHistory(JSON.parse(history));
  }, []);

  // Save persistence on change
  useEffect(() => {
    localStorage.setItem('ai_travel_saved', JSON.stringify(savedItineraries));
  }, [savedItineraries]);

  useEffect(() => {
    localStorage.setItem('ai_travel_history', JSON.stringify(tripHistory));
  }, [tripHistory]);

  const handleFormSubmit = (prefs: TripPreferences) => {
    setCurrentPreferences(prefs);
    setGenState('LOADING');
    fetchItinerary(prefs);
  };

  const fetchItinerary = async (prefs: TripPreferences) => {
    try {
      const result = await generateItinerary(prefs);
      setCurrentItinerary(result);
      setTripHistory(prev => [result, ...prev]);
      setGenState('IDLE');
      setView('ITINERARY_DETAILS');
    } catch (error) {
      console.error(error);
      setGenState('ERROR');
    }
  };

  const handleRetry = () => {
    if (currentPreferences) {
      setGenState('LOADING');
      fetchItinerary(currentPreferences);
    } else {
      setGenState('IDLE');
      setView('HOME');
    }
  };

  const handleBackToForm = () => {
    setGenState('IDLE');
    setView('HOME');
    // We do NOT clear currentItinerary so we can navigate back to "Current" if needed, 
    // but typically "Back" from details goes to the previous list or home.
    // If we want to support "Back" behavior:
    if (view === 'ITINERARY_DETAILS') {
       // If coming from Saved list logic could be added here, simplified for now:
       setView('HOME'); 
    }
  };

  const handleToggleSave = (itinerary: Itinerary) => {
    const isSaved = savedItineraries.some(i => i.id === itinerary.id);
    if (isSaved) {
      setSavedItineraries(prev => prev.filter(i => i.id !== itinerary.id));
    } else {
      setSavedItineraries(prev => [itinerary, ...prev]);
    }
  };

  const handleViewTrip = (itinerary: Itinerary) => {
      setCurrentItinerary(itinerary);
      setView('ITINERARY_DETAILS');
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your trip history? This action cannot be undone.')) {
        setTripHistory([]);
        localStorage.removeItem('ai_travel_history');
    }
  };

  const calculateFavoriteVibe = () => {
    if (tripHistory.length === 0) return 'Undecided';
    
    // Extract valid vibes
    const vibes = tripHistory.map(t => t.vibe).filter(Boolean) as string[];
    
    if (vibes.length === 0) return 'Undecided';
    
    // Count occurrences
    const counts = vibes.reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    // Find the vibe with the max count
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  // --- RENDER LOGIC ---

  // 1. Loading Overlay
  if (genState === 'LOADING' && currentPreferences) {
    return <LoadingScreen destination={currentPreferences.destination} onCancel={handleBackToForm} />;
  }

  // 2. Error Screen
  if (genState === 'ERROR') {
    return <ErrorScreen onRetry={handleRetry} onBack={handleBackToForm} />;
  }

  // 3. Itinerary Details View (Full Screen takeover)
  if (view === 'ITINERARY_DETAILS' && currentItinerary) {
    const isSaved = savedItineraries.some(i => i.id === currentItinerary.id);
    return (
        <ItineraryDisplay 
            data={currentItinerary} 
            onBack={() => setView('HOME')} // Or simple history back
            isSaved={isSaved}
            onToggleSave={handleToggleSave}
            onNavigate={setView}
        />
    );
  }

  // 4. Main App Wrapper with Bottom Navigation for (HOME | SAVED | TRIPS | PROFILE)
  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden bg-background-dark">
      
      {/* Background Image (visible on Home) */}
      {view === 'HOME' && (
        <div className="fixed inset-0 z-0 h-[60vh] w-full">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-dark/80 to-background-dark z-10"></div>
            <img
            alt="Dark moody scenic travel landscape"
            className="h-full w-full object-cover opacity-60"
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop"
            />
        </div>
      )}

      {/* Conditional Header based on View */}
      {view === 'HOME' && (
        <header className="fixed top-0 z-50 w-full px-4 py-4">
            <div className="flex items-center justify-between rounded-full bg-background-dark/30 backdrop-blur-md border border-white/5 p-2 pl-4 pr-2 shadow-lg">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">public</span>
                <span className="font-bold text-lg tracking-tight text-white">VELORA Explorer</span>
            </div>
            <button 
                onClick={() => setView('PROFILE')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
            </button>
            </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col w-full max-w-md mx-auto">
        
        {view === 'HOME' && (
            <div className="px-4 pt-28 pb-32">
                <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2 shadow-[0_0_15px_rgba(19,236,109,0.2)]">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    <span>AI-Powered Itineraries</span>
                </div>
                <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white drop-shadow-lg">
                    Curate your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-primary">next adventure.</span>
                </h1>
                <p className="text-gray-300 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                    Let our AI craft the perfect journey based on your unique taste and budget.
                </p>
                </div>
                <TripForm onSubmit={handleFormSubmit} />
                
                {/* Recent/History Preview */}
                {tripHistory.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between px-1 mb-4">
                            <h2 className="text-white text-lg font-bold">Recent Plans</h2>
                            <button onClick={() => setView('TRIPS')} className="text-primary text-sm font-medium hover:underline">View all</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                             {tripHistory.slice(0, 5).map(trip => (
                                <div key={trip.id} onClick={() => handleViewTrip(trip)} className="shrink-0 w-64 h-32 rounded-xl relative overflow-hidden group cursor-pointer border border-white/10">
                                    <div className="absolute inset-0 bg-surface-dark/50"></div> 
                                    {/* Using a generic gradient or mapping ID to image if stored */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    <div className="absolute bottom-3 left-3">
                                        <p className="text-white font-bold text-lg leading-tight">{trip.tripTitle}</p>
                                        <p className="text-gray-300 text-xs mt-0.5">{trip.dateRange}</p>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {view === 'SAVED' && (
            <SavedTripsList 
                title="Saved Itineraries" 
                trips={savedItineraries} 
                onSelectTrip={handleViewTrip}
                emptyMessage="You haven't saved any trips yet. Tap the heart icon on an itinerary to save it." 
            />
        )}

        {view === 'TRIPS' && (
            <SavedTripsList 
                title="Trip History" 
                trips={tripHistory} 
                onSelectTrip={handleViewTrip}
                emptyMessage="No history found. Generate your first trip!"
            />
        )}

        {view === 'PROFILE' && (
            <Profile 
                savedCount={savedItineraries.length} 
                tripsCount={tripHistory.length} 
                topVibe={calculateFavoriteVibe()}
                onClearHistory={handleClearHistory}
            />
        )}

      </main>

      {/* Main Bottom Navigation */}
      <nav className="fixed bottom-0 z-50 w-full border-t border-white/5 bg-background-dark/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 pb-8 pt-4">
          <button 
            onClick={() => setView('HOME')}
            className={`group flex flex-col items-center gap-1 transition-colors ${view === 'HOME' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className={`material-symbols-outlined text-[24px] ${view === 'HOME' ? 'filled' : ''}`}>home</span>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          
          <button 
            onClick={() => setView('SAVED')}
            className={`group flex flex-col items-center gap-1 transition-colors ${view === 'SAVED' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className={`material-symbols-outlined text-[24px] ${view === 'SAVED' ? 'filled' : ''}`}>favorite</span>
            <span className="text-[10px] font-medium">Saved</span>
          </button>
          
          <div className="relative -top-6">
            <button 
                onClick={() => setView('HOME')}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-background-dark shadow-lg shadow-primary/30 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>
          
          <button 
            onClick={() => setView('TRIPS')}
            className={`group flex flex-col items-center gap-1 transition-colors ${view === 'TRIPS' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className={`material-symbols-outlined text-[24px] ${view === 'TRIPS' ? 'filled' : ''}`}>airplane_ticket</span>
            <span className="text-[10px] font-medium">Trips</span>
          </button>
          
          <button 
            onClick={() => setView('PROFILE')}
            className={`group flex flex-col items-center gap-1 transition-colors ${view === 'PROFILE' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className={`material-symbols-outlined text-[24px] ${view === 'PROFILE' ? 'filled' : ''}`}>person</span>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;