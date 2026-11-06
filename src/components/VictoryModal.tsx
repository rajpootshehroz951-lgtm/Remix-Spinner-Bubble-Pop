import React from 'react';
import { Trophy, ArrowRight, RotateCcw, Grid, Home, Sparkles } from 'lucide-react';
import { sound } from '../game/sound';
import { getLevel, TOTAL_LEVELS } from '../game/levels';

interface VictoryModalProps {
  levelIdx: number;
  score: number;
  shots: number;
  isNewHigh: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelIdx,
  score,
  shots,
  isNewHigh,
  onNextLevel,
  onReplay,
  onLevelSelect,
  onMainMenu,
}) => {
  const currentLvl = getLevel(levelIdx);
  const isFinalLevel = levelIdx >= TOTAL_LEVELS - 1;

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 bg-[#05020f]/92 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xs flex flex-col items-center text-center my-auto">
        {/* Animated Trophy Icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#ffd36b]/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ffd36b] to-[#ff9a5c] flex items-center justify-center shadow-[0_8px_24px_rgba(255,211,107,0.35)]">
            <Trophy className="w-8 h-8 text-slate-950 fill-slate-950" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#ffd36b] via-[#8aff6b] to-[#6be3ff] bg-clip-text text-transparent mb-1">
          {isFinalLevel ? 'You Beat the Game!' : 'Level Cleared!'}
        </h2>
        <div className="text-sm font-semibold text-white/90 mb-1">
          {currentLvl.name}
        </div>
        <div className="text-xs text-white/60 mb-3">
          Level {levelIdx + 1} of {TOTAL_LEVELS}
        </div>

        {/* Score Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 mb-4 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Score
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#ffd36b]">
              {score}
            </span>
            {isNewHigh && (
              <span className="flex items-center gap-1 text-[10px] text-[#8aff6b] font-bold">
                <Sparkles className="w-2.5 h-2.5" /> High Score!
              </span>
            )}
          </div>

          <div className="w-px h-8 bg-white/15" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Shots
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#6be3ff]">
              {shots}
            </span>
            <span className="text-[10px] text-white/40">Used</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {!isFinalLevel && (
            <button
              onClick={() => {
                sound.playClick();
                onNextLevel();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff6ec7] to-[#8a5cff] text-white font-bold text-sm tracking-wide shadow-[0_8px_24px_rgba(138,92,255,0.45)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Next Level</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onReplay();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-white/80" />
            <span>Replay Level</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onLevelSelect();
            }}
            className="w-full py-2.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Grid className="w-3.5 h-3.5 text-white/70" />
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
