import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Itinerary, Activity } from '../types';

interface ItineraryMapProps {
  data: Itinerary;
}

// Fix for default marker icons missing in webpack/esm builds
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Helper component to fit map bounds to markers
const MapBounds = ({ activities }: { activities: Activity[] }) => {
  const map = useMap();

  useEffect(() => {
    if (activities.length > 0) {
      const latLngs = activities
        .filter(a => a.coordinates)
        .map(a => [a.coordinates!.lat, a.coordinates!.lng] as [number, number]);
      
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [activities, map]);

  return null;
};

const ItineraryMap: React.FC<ItineraryMapProps> = ({ data }) => {
  // Extract all activities that have coordinates
  const allActivities = useMemo(() => {
    return data.days.flatMap(day => 
      day.activities.map(act => ({ ...act, day: day.day }))
    ).filter(a => a.coordinates);
  }, [data]);

  // Default center (fallback)
  const defaultCenter: [number, number] = [0, 0];

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={2} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds activities={allActivities} />

        {allActivities.map((activity, idx) => (
          <Marker 
            key={`${activity.day}-${idx}`}
            position={[activity.coordinates!.lat, activity.coordinates!.lng]}
            icon={icon}
          >
            <Popup className="custom-popup">
              <div className="flex flex-col gap-1 min-w-[150px]">
                <div className="flex items-center gap-2">
                    <span className="bg-primary text-background-dark text-[10px] font-bold px-1.5 py-0.5 rounded">Day {activity.day}</span>
                    <span className="text-[10px] text-gray-500 font-bold">{activity.time}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{activity.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{activity.desc}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ItineraryMap;