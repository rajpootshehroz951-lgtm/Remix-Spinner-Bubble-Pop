import React from 'react';
import { Play, Grid, HelpCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../game/sound';
import { TOTAL_LEVELS } from '../game/levels';

interface TitleModalProps {
  unlockedLevel: number;
  completedCount: number;
  soundEnabled: boolean;
  onStart: (lvlIdx: number) => void;
  onOpenLevelSelect: () => void;
  onOpenHowToPlay: () => void;
  onToggleSound: () => void;
}

export const TitleModal: React.FC<TitleModalProps> = ({
  unlockedLevel,
  completedCount,
  soundEnabled,
  onStart,
  onOpenLevelSelect,
  onOpenHowToPlay,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 bg-[#05020f]/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto">
        {/* Version & Badge */}
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-widest text-[#ffd36b]/80 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Orbital Physics Arcade</span>
          <span className="text-white/40">·</span>
          <span className="text-white/50">v1.1</span>
        </div>

        {/* Title Lockup */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#ff6ec7] via-[#ffd36b] to-[#6be3ff] bg-clip-text text-transparent pb-1 drop-shadow-[0_4px_16px_rgba(255,110,199,0.35)]">
          Spinner Pop
        </h1>

        {/* Level Stats Pill */}
        <div className="mt-2 mb-4 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/90">
          <span className="text-[#ffd36b] font-bold">{completedCount}</span> / {TOTAL_LEVELS} Levels Cleared
        </div>

        {/* Brief Hook */}
        <p className="text-xs sm:text-sm text-white/70 max-w-xs leading-relaxed mb-5">
          Shoot bubbles at the spinning cluster. Off-center impacts impart angular torque. Match 3+ to burst clusters!
        </p>

        {/* Tier Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/60 mb-6 px-2 py-2 bg-white/5 rounded-xl border border-white/10">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8aff6b]" /> Beginner
          </span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6be3ff]" /> Rising
          </span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffd36b]" /> Expert
          </span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff9a5c]" /> Master
          </span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff5c8a]" /> Legend
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 max-w-[260px]">
          <button
            onClick={() => {
              sound.playClick();
              onStart(unlockedLevel);
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff6ec7] to-[#8a5cff] text-white font-bold text-sm tracking-wide shadow-[0_8px_24px_rgba(138,92,255,0.45)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Level {unlockedLevel + 1}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLevelSelect();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Grid className="w-4 h-4 text-white/80" />
            <span>Select Level</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => {
                sound.playClick();
                onOpenHowToPlay();
              }}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-medium text-white/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-white/60" />
              <span>How to Play</span>
            </button>

            <button
              onClick={onToggleSound}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-medium text-white/80 transition-colors flex items-center justify-center gap-1.5"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#ffd36b]" />
                  <span>Audio ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/40" />
                  <span>Audio Muted</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Controls Hint */}
        <div className="mt-6 text-[11px] text-white/45 tracking-wide">
          Drag / Arrows to Aim · Release / Space to Shoot · Esc to Pause
        </div>
        <div className="mt-2 text-[10px] tracking-widest text-white/30 uppercase">
          R.S Studio
        </div>
      </div>
    </div>
  );
};
