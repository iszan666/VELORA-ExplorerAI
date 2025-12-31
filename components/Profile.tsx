import React from 'react';
import 'leaflet/dist/leaflet.css'

interface ProfileProps {
  savedCount: number;
  tripsCount: number;
  topVibe: string;
  onClearHistory: () => void;
}

const Profile: React.FC<ProfileProps> = ({ savedCount, tripsCount, topVibe, onClearHistory }) => {
  
  const getVibeIcon = (vibe: string) => {
    switch (vibe) {
        case 'Nature': return 'landscape';
        case 'Urban': return 'location_city';
        case 'Relax': return 'self_improvement';
        case 'Food': return 'restaurant';
        default: return 'auto_awesome';
    }
  };

  return (
    <div className="w-full min-h-screen pb-24 bg-background-dark relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

       <div className="relative z-10 p-6 pt-12 flex flex-col items-center">
         {/* Avatar */}
         <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-1">
                <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center overflow-hidden border border-background-dark">
                    <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
                </div>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-background-dark flex items-center justify-center shadow-lg border border-background-dark">
                <span className="material-symbols-outlined text-sm font-bold">edit</span>
            </button>
         </div>

         <h2 className="text-2xl font-bold text-white mb-1">Explorer</h2>
         <p className="text-sm text-gray-400 mb-8">Ready for the next adventure</p>

         {/* Stats */}
         <div className="flex w-full max-w-sm gap-3 mb-8">
            <div className="flex-1 glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                <span className="text-2xl font-bold text-white">{tripsCount}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold text-center">Trips Created</span>
            </div>
            <div className="flex-1 glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                <span className="text-2xl font-bold text-primary">{savedCount}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold text-center">Saved</span>
            </div>
            <div className="flex-1 glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-1 border-primary/20 bg-primary/5">
                <span className="material-symbols-outlined text-2xl text-primary mb-1">{getVibeIcon(topVibe)}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold text-center line-clamp-1">{topVibe}</span>
            </div>
         </div>

         {/* Settings List */}
         <div className="w-full max-w-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Settings</h3>
            
            <button className="w-full glass-card p-4 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300">dark_mode</span>
                    </div>
                    <span className="text-sm font-medium text-white">Appearance</span>
                </div>
                <span className="text-xs text-gray-500">Dark</span>
            </button>

            <button className="w-full glass-card p-4 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300">notifications</span>
                    </div>
                    <span className="text-sm font-medium text-white">Notifications</span>
                </div>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 h-3 w-3 bg-white rounded-full shadow-sm"></div>
                </div>
            </button>

            <button className="w-full glass-card p-4 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300">language</span>
                    </div>
                    <span className="text-sm font-medium text-white">Language</span>
                </div>
                <span className="text-xs text-gray-500">English</span>
            </button>
            
            <div className="pt-4 space-y-3">
                <button 
                    onClick={onClearHistory}
                    className="w-full glass-card p-4 rounded-xl flex items-center justify-center text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors border-red-500/20"
                >
                    Clear History
                </button>

                <button className="w-full p-2 rounded-xl flex items-center justify-center text-gray-500 text-sm font-medium hover:text-white transition-colors">
                    Sign Out
                </button>
            </div>
         </div>
       </div>
    </div>
  );
};

export default Profile;
