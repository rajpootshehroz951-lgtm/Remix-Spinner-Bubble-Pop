import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Star, Lock } from 'lucide-react';
import { TOTAL_LEVELS, LEVELS_PER_PAGE, TOTAL_PAGES, tierName, tierColor } from '../game/levels';
import { sound } from '../game/sound';

interface LevelSelectModalProps {
  completedLevels: number[];
  bestScores: Record<number, number>;
  onSelectLevel: (lvlIdx: number) => void;
  onBack: () => void;
  initialLevel?: number;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  completedLevels,
  bestScores,
  onSelectLevel,
  onBack,
  initialLevel = 0,
}) => {
  const [page, setPage] = useState(() => Math.floor(initialLevel / LEVELS_PER_PAGE));

  const isCompleted = (idx: number) => completedLevels.includes(idx);

  const isUnlocked = (idx: number) => {
    if (idx === 0) return true;
    return completedLevels.includes(idx - 1) || completedLevels.includes(idx);
  };

  const startIdx = page * LEVELS_PER_PAGE;
  const endIdx = Math.min(startIdx + LEVELS_PER_PAGE, TOTAL_LEVELS);
  const currentTier = tierName(startIdx);
  const currentTierColor = tierColor(startIdx);

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-3 sm:p-4 bg-[#05020f]/95 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center my-auto">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ff6ec7] via-[#ffd36b] to-[#6be3ff] bg-clip-text text-transparent">
            Select Level
          </h2>

          <div className="w-16" /> {/* spacer */}
        </div>

        {/* Tier Info & Cleared Count */}
        <div className="flex items-center gap-2 mb-3 text-xs text-white/80">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: currentTierColor }}
            />
            <span className="font-semibold text-white">{currentTier} Tier</span>
          </span>
          <span className="text-white/30">·</span>
          <span>
            <strong className="text-[#ffd36b]">{completedLevels.length}</strong> / {TOTAL_LEVELS} Cleared
          </span>
        </div>

        {/* Page Nav */}
        <div className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-3 py-2 mb-3">
          <button
            onClick={() => {
              sound.playClick();
              setPage((p) => Math.max(0, p - 1));
            }}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-white/90">
            Page {page + 1} of {TOTAL_PAGES} ({startIdx + 1} - {endIdx})
          </span>

          <button
            onClick={() => {
              sound.playClick();
              setPage((p) => Math.min(TOTAL_PAGES - 1, p + 1));
            }}
            disabled={page >= TOTAL_PAGES - 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Level Grid (5 columns x 4 rows = 20) */}
        <div className="w-full grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: LEVELS_PER_PAGE }).map((_, i) => {
            const idx = startIdx + i;
            if (idx >= TOTAL_LEVELS) return null;
            const completed = isCompleted(idx);
            const unlocked = isUnlocked(idx);
            const score = bestScores[idx];

            let bgClass = 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed';
            if (completed) {
              bgClass = 'bg-gradient-to-br from-[#6be3ff]/30 to-[#8aff6b]/30 text-white border-[#6be3ff]/40 shadow-sm hover:scale-105 active:scale-95';
            } else if (unlocked) {
              bgClass = 'bg-gradient-to-br from-[#8a5cff]/35 to-[#ff6ec7]/35 text-white border-white/30 shadow-sm hover:scale-105 active:scale-95';
            }

            return (
              <button
                key={idx}
                disabled={!unlocked}
                onClick={() => {
                  sound.playClick();
                  onSelectLevel(idx);
                }}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border transition-all ${bgClass}`}
              >
                {/* Tier dot in corner */}
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: tierColor(idx) }}
                />

                <span className="font-bold text-xs sm:text-sm font-mono tabular-nums leading-none">
                  {idx + 1}
                </span>

                {completed ? (
                  <Star className="w-2.5 h-2.5 text-[#ffd36b] fill-[#ffd36b] mt-0.5" />
                ) : !unlocked ? (
                  <Lock className="w-2.5 h-2.5 text-white/30 mt-0.5" />
                ) : score ? (
                  <span className="text-[9px] font-mono text-[#ffd36b] leading-tight">
                    {score}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Quick legend */}
        <div className="w-full flex items-center justify-center gap-4 text-[11px] text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-[#6be3ff]/40 to-[#8aff6b]/40 border border-[#6be3ff]/40 inline-flex items-center justify-center">
              <Star className="w-2 h-2 text-[#ffd36b] fill-[#ffd36b]" />
            </span>
            <span>Cleared</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-br from-[#8a5cff]/40 to-[#ff6ec7]/40 border border-white/30" />
            <span>Unlocked</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white/5 border border-white/10" />
            <span>Locked</span>
          </span>
        </div>
      </div>
    </div>
  );
};
