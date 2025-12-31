import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  destination: string;
  onCancel: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ destination, onCancel }) => {
  const [tipIndex, setTipIndex] = useState(0);
  
  const loadingTips = [
    "Finding hidden gems...",
    "Analyzing weather patterns...",
    "Curating local experiences...",
    "Checking travel distances...",
    "Locating best photo spots..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % loadingTips.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-background-dark">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-background-dark via-background-dark/80 to-background-dark z-20"></div>
         <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
            alt="Background" 
            className="h-full w-full object-cover opacity-30 animate-scale-subtle"
         />
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
            <div 
                key={i}
                className="absolute bg-primary/20 rounded-full blur-[1px] animate-float"
                style={{
                    width: Math.random() * 6 + 2 + 'px',
                    height: Math.random() * 6 + 2 + 'px',
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 5 + 's',
                    opacity: Math.random() * 0.5 + 0.2
                }}
            ></div>
        ))}
      </div>

      {/* Top Navigation */}
      <div className="relative z-30 flex items-center justify-between p-4 pt-6">
        <button onClick={onCancel} className="group flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white backdrop-blur-sm bg-white/5 border border-white/5">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Generating</span>
        </div>
        <div className="size-10"></div>
      </div>

      {/* Central Content */}
      <div className="relative z-30 flex flex-1 flex-col items-center justify-center px-6 -mt-10">
        
        {/* Advanced Scanner Animation */}
        <div className="relative mb-12 flex items-center justify-center">
            {/* Ambient Glow */}
            <div className="absolute size-96 rounded-full bg-primary/5 blur-[100px] animate-pulse-slow"></div>
            
            {/* Outer Ring */}
            <div className="absolute size-72 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]">
                <div className="absolute -top-1 left-1/2 w-2 h-2 bg-white/20 rounded-full blur-[1px]"></div>
            </div>

            {/* Middle Dashed Ring */}
            <div className="absolute size-60 rounded-full border border-dashed border-white/10 animate-[spin_15s_linear_infinite_reverse]"></div>
            
            {/* Inner Scanner Ring */}
            <div className="absolute size-48 rounded-full border-t-2 border-l-2 border-primary/40 border-r-transparent border-b-transparent animate-[spin_3s_linear_infinite] shadow-[0_0_15px_rgba(19,236,109,0.2)]"></div>

            {/* Core */}
            <div className="relative size-36 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080')] bg-cover opacity-40 mix-blend-screen"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent opacity-80"></div>
                
                {/* Icon */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                     <span className="material-symbols-outlined text-4xl text-primary animate-bounce">flight</span>
                </div>
            </div>
        </div>

        {/* Text Content */}
        <div className="text-center max-w-xs mx-auto z-10">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
             {destination}
          </h2>
          <div className="h-6 overflow-hidden relative">
             <p className="text-primary font-medium text-sm animate-pulse">
                {loadingTips[tipIndex]}
             </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-[200px] mt-8">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="absolute left-0 top-0 h-full w-[40%] rounded-full bg-primary shadow-[0_0_15px_rgba(19,236,109,0.8)] animate-[shimmer_1s_infinite_linear]"></div>
          </div>
        </div>
      </div>

      {/* Footer Facts */}
      <div className="relative z-30 w-full p-6 pb-10">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex gap-3">
                <div className="mt-1">
                    <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">AI Trip Architect</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Crafting a day-by-day plan optimized for your budget and travel style.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;