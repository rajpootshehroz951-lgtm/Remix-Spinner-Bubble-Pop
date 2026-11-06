import React from 'react';
import { Play, RotateCcw, Grid, Home } from 'lucide-react';
import { sound } from '../game/sound';
import { getLevel } from '../game/levels';

interface PauseModalProps {
  levelIdx: number;
  score: number;
  shots: number;
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  levelIdx,
  score,
  shots,
  onResume,
  onRestart,
  onLevelSelect,
  onMainMenu,
}) => {
  const currentLvl = getLevel(levelIdx);

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 bg-[#05020f]/90 backdrop-blur-md">
      <div className="w-full max-w-xs flex flex-col items-center text-center my-auto">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#ff6ec7] via-[#ffd36b] to-[#6be3ff] bg-clip-text text-transparent mb-1">
          Paused
        </h2>
        <div className="text-sm font-semibold text-white/90 mb-1">
          {currentLvl.name}
        </div>
        <div className="text-xs text-white/60 mb-5">
          Level {levelIdx + 1} · Score: <span className="font-mono text-[#ffd36b] font-bold">{score}</span> · Shots: <span className="font-mono text-[#6be3ff]">{shots}</span>
        </div>

        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff6ec7] to-[#8a5cff] text-white font-bold text-sm tracking-wide shadow-[0_8px_24px_rgba(138,92,255,0.45)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-white/80" />
            <span>Restart Level</span>
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
            className="w-full py-2.5 px-6 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 mt-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
