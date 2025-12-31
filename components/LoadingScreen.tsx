import React, { useState, useEffect } from 'react';
import { fetchDestinationGallery } from '../services/geminiService';

interface LoadingScreenProps {
  destination: string;
  onCancel: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ destination, onCancel }) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Rotating subtle progress messages
  const progressMessages = [
    "Analyzing weather patterns...",
    "Curating hidden local gems...",
    "Optimizing travel routes...",
    "Selecting dining experiences...",
    "Finalizing your bespoke plan..."
  ];

  // Fetch images on mount
  useEffect(() => {
    let mounted = true;
    const loadImages = async () => {
        const gallery = await fetchDestinationGallery(destination);
        if (mounted && gallery.length > 0) {
            setImages(gallery);
        }
    };
    loadImages();
    return () => { mounted = false; };
  }, [destination]);

  // Slideshow interval (2-3 seconds)
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  // Message rotation
  useEffect(() => {
    const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % progressMessages.length);
    }, 2500); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark">
      {/* Slideshow Layer */}
      {images.length > 0 ? (
          images.map((img, index) => (
              <div 
                  key={index}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                  style={{ 
                      backgroundImage: `url('${img}')`,
                      transitionProperty: 'opacity, transform',
                      transitionDuration: '1500ms, 10000ms' // Long transform for slow zoom effect
                  }}
              />
          ))
      ) : (
          // Elegant placeholder while fetching gallery
          <div className="absolute inset-0 bg-background-dark animate-pulse bg-gradient-to-b from-surface-dark to-background-dark" />
      )}
      
      {/* Premium Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80 z-10" />

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col items-center text-center p-8 max-w-xl animate-in fade-in zoom-in-95 duration-700">
           
           {/* PREMIUM ORBITAL LOADER */}
           <div className="relative flex items-center justify-center w-28 h-28 mb-10">
              {/* Deep Atmospheric Glow */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-slow"></div>
              
              {/* Ring 1: Outer Slow Orbit */}
              <svg className="absolute inset-0 w-full h-full text-white/10 animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="1" />
                  <path d="M50 1 A49 49 0 0 1 99 50" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              </svg>

              {/* Ring 2: Middle Dashed Reverse */}
              <svg className="absolute inset-0 w-full h-full text-primary/30 animate-[spin_5s_linear_infinite]" style={{ animationDirection: 'reverse' }} viewBox="0 0 100 100">
                   <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
              </svg>

              {/* Ring 3: Inner Active Arc */}
              <svg className="absolute inset-0 w-full h-full text-primary animate-[spin_1.5s_linear_infinite]" viewBox="0 0 100 100">
                   <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="30 150" strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(19,236,109,0.8)]" />
              </svg>

              {/* Central Core */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-[#102218] rounded-full border border-primary/20 shadow-[0_0_15px_rgba(19,236,109,0.3)]">
                  <span className="material-symbols-outlined text-primary text-2xl animate-pulse">auto_awesome</span>
              </div>
           </div>
           
           <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-2xl mb-4">
              Designing your journey to {destination}
           </h2>
           
           <div className="h-8 overflow-hidden">
               <p key={messageIndex} className="text-lg md:text-xl text-gray-200 font-light tracking-wide animate-in slide-in-from-bottom-2 fade-in duration-500">
                  {progressMessages[messageIndex]}
               </p>
           </div>
      </div>

      {/* Discreet Cancel Button */}
      <button 
          onClick={onCancel} 
          className="absolute top-6 right-6 z-30 text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
      >
          <span className="material-symbols-outlined text-2xl">close</span>
      </button>
      
      {/* Bottom Branding */}
      <div className="absolute bottom-8 z-20 flex items-center gap-2 opacity-60">
          <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
          <span className="text-xs font-bold tracking-widest text-white uppercase">Velora AI Architect</span>
      </div>
    </div>
  );
};

export default LoadingScreen;