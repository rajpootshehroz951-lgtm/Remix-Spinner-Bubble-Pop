import React, { useEffect, useState } from 'react';
import { sound } from '../game/sound';

interface SplashProps {
  onDismiss: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onDismiss }) => {
  const [fading, setFading] = useState(false);

  const handleDismiss = () => {
    if (fading) return;
    sound.init();
    sound.playClick();
    setFading(true);
    setTimeout(onDismiss, 600);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-600 bg-[radial-gradient(ellipse_at_center,_#1a1040_0%,_#05020f_100%)] ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-44 h-44 flex items-center justify-center animate-logo-entrance">
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,110,199,0.38)_0%,_rgba(138,92,255,0.22)_40%,_transparent_70%)] animate-pulse-glow" />
        
        {/* Outer orbital decorative ring */}
        <div className="absolute -inset-2.5 rounded-full border-2 border-[#ffd36b]/30 animate-ring-expand" />

        {/* Studio monogram */}
        <div className="relative z-10 text-6xl font-black tracking-tighter bg-gradient-to-br from-[#ff6ec7] via-[#ffd36b] to-[#6be3ff] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,110,199,0.5)]">
          R.S
        </div>
      </div>

      <div className="mt-5 text-sm tracking-[0.55em] font-light text-white/80 uppercase">
        Studio
      </div>
      <div className="mt-2 text-[10px] tracking-[0.3em] font-medium text-white/40 uppercase">
        Presents
      </div>

      <div className="absolute bottom-10 text-[11px] tracking-[0.2em] text-white/50 animate-blink-slow uppercase">
        Tap anywhere to start
      </div>
    </div>
  );
};
