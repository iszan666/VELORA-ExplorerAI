import React from 'react';

interface ErrorScreenProps {
  onRetry: () => void;
  onBack: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ onRetry, onBack }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col mx-auto max-w-md overflow-hidden bg-background-dark shadow-2xl">
      <header className="flex items-center justify-between p-4 z-10">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white backdrop-blur-sm">
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
        <div className="flex items-center gap-1 opacity-80">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>smart_toy</span>
          <span className="text-xs font-medium tracking-wider uppercase text-gray-400">AI Concierge</span>
        </div>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 -mt-10">
        <div className="relative mb-8 group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[50px] animate-pulse"></div>
          <div className="relative z-10 w-48 h-48 rounded-2xl overflow-hidden border border-white/10 bg-surface-dark/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_-10px_rgba(19,236,109,0.3)]">
            <div className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="relative z-20 flex flex-col items-center justify-center text-white/90">
              <span className="material-symbols-outlined text-5xl mb-2 text-primary drop-shadow-md">share_location</span>
              <span className="material-symbols-outlined text-3xl absolute -bottom-1 -right-2 text-red-400 animate-bounce">error</span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-3 max-w-xs mx-auto mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            We encountered a <br /> <span className="text-primary">bump in the road</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Our AI couldn't finalize your itinerary right now. This is likely a temporary connection issue.
          </p>
        </div>

        <div className="w-full bg-surface-dark border border-white/5 rounded-xl p-4 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-sm">lightbulb</span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Fixes</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5">wifi_off</span>
              <span className="text-sm text-gray-300">Check your internet connection and try again.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-gray-500 text-sm mt-0.5">map</span>
              <span className="text-sm text-gray-300">Try selecting a different destination.</span>
            </li>
          </ul>
        </div>

        <div className="w-full space-y-3">
          <button onClick={onRetry} className="w-full h-12 flex items-center justify-center gap-2 bg-primary hover:bg-[#10d860] active:scale-[0.98] text-background-dark font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
            Regenerate Itinerary
          </button>
          <button onClick={onBack} className="w-full h-12 flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:bg-white/5 active:scale-[0.98] text-white font-medium rounded-lg transition-all duration-200">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
            Modify Preferences
          </button>
        </div>
      </main>
    </div>
  );
};

export default ErrorScreen;