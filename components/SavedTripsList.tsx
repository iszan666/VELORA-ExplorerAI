import React from 'react';
import { Itinerary } from '../types';

interface SavedTripsListProps {
  title: string;
  trips: Itinerary[];
  onSelectTrip: (trip: Itinerary) => void;
  emptyMessage?: string;
}

const SavedTripsList: React.FC<SavedTripsListProps> = ({ title, trips, onSelectTrip, emptyMessage = "No trips found." }) => {
  // Fallback if no heroImage exists (for older saved data)
  const getBgImage = (trip: Itinerary) => {
    if (trip.heroImage) return trip.heroImage;
    
    // Legacy fallback
    const bgImages = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop"
    ];
    const index = trip.id.charCodeAt(0) % bgImages.length;
    return bgImages[index];
  };

  return (
    <div className="w-full pb-24">
      <div className="sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md p-4 border-b border-white/5">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      
      <div className="p-4 space-y-4">
        {trips.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
             <span className="material-symbols-outlined text-4xl mb-2">luggage</span>
             <p>{emptyMessage}</p>
           </div>
        ) : (
          trips.map((trip) => (
            <div 
              key={trip.id} 
              onClick={() => onSelectTrip(trip)}
              className="group relative h-40 w-full overflow-hidden rounded-2xl border border-white/10 cursor-pointer shadow-lg active:scale-[0.98] transition-all"
            >
              <img 
                src={getBgImage(trip)} 
                alt={trip.tripTitle}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1">{trip.tripTitle}</h3>
                        <p className="text-xs text-gray-300 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {trip.dateRange}
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-primary font-bold">{trip.totalBudget}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{trip.days.length} Days</span>
                    </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedTripsList;