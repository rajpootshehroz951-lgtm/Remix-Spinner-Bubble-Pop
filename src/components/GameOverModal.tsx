import React from 'react';
import { AlertCircle, RotateCcw, Grid, Home } from 'lucide-react';
import { sound } from '../game/sound';
import { getLevel } from '../game/levels';

interface GameOverModalProps {
  levelIdx: number;
  score: number;
  shots: number;
  onRetry: () => void;
  onLevelSelect: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  levelIdx,
  score,
  shots,
  onRetry,
  onLevelSelect,
  onMainMenu,
}) => {
  const currentLvl = getLevel(levelIdx);

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 bg-[#05020f]/92 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xs flex flex-col items-center text-center my-auto">
        {/* Skull / Warning Icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-[0_8px_24px_rgba(244,63,94,0.35)]">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-[#ffd36b] to-rose-400 bg-clip-text text-transparent mb-1">
          Cluster Breach!
        </h2>
        <div className="text-sm font-semibold text-white/90 mb-1">
          {currentLvl.name}
        </div>
        <p className="text-xs text-white/60 mb-3 max-w-[220px]">
          The spinning cluster reached past the bottom danger perimeter line.
        </p>

        {/* Score Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 mb-4 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Score
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#ffd36b]">
              {score}
            </span>
          </div>

          <div className="w-px h-8 bg-white/15" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Shots
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#6be3ff]">
              {shots}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onRetry();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm tracking-wide shadow-[0_8px_24px_rgba(244,63,94,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Level</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onLevelSelect();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Grid className="w-4 h-4 text-white/80" />
            <span>Level Select</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="w-full py-2 px-6 rounded-xl hover:bg-white/5 active:scale-95 text-white/50 hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
