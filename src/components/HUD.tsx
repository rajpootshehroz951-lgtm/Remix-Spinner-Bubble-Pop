import React from 'react';
import { Menu, Volume2, VolumeX, HelpCircle, Flame } from 'lucide-react';
import { sound } from '../game/sound';
import { getLevel } from '../game/levels';
import { ComboState } from '../game/types';

interface HUDProps {
  levelIdx: number;
  score: number;
  shots: number;
  soundEnabled: boolean;
  combo?: ComboState | null;
  onToggleSound: () => void;
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  levelIdx,
  score,
  shots,
  soundEnabled,
  combo,
  onToggleSound,
  onOpenMenu,
  onOpenHelp,
}) => {
  const currentLvl = getLevel(levelIdx);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex flex-col items-center pointer-events-none p-2 sm:p-3 gap-1.5">
      <div className="w-full max-w-[480px] flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
        {/* Left actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              sound.playClick();
              onOpenMenu();
            }}
            aria-label="Pause Menu"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white transition-all shadow-sm"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white transition-all shadow-sm"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#ffd36b]" /> : <VolumeX className="w-4 h-4 text-white/50" />}
          </button>
        </div>

        {/* Level & Tier Badge */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: currentLvl.tierColor }}
            />
            <span className="text-xs font-bold tracking-wide uppercase text-white/90">
              Lvl {levelIdx + 1}
            </span>
          </div>
          <span className="text-[10px] text-white/60 font-medium truncate max-w-[110px]">
            {currentLvl.name}
          </span>
        </div>

        {/* Stats cluster with tabular-nums */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-wider text-white/50 font-semibold leading-tight">
                Score
              </span>
              {combo && combo.multiplier >= 2 && (
                <span
                  className="px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-tight text-black shadow-sm"
                  style={{ backgroundColor: combo.color }}
                >
                  {combo.multiplier}x
                </span>
              )}
            </div>
            <span className="font-mono tabular-nums text-sm font-bold text-[#ffd36b] leading-tight">
              {score}
            </span>
          </div>

          <div className="h-5 w-px bg-white/15" />

          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-white/50 font-semibold leading-tight">
              Shots
            </span>
            <span className="font-mono tabular-nums text-sm font-bold text-[#6be3ff] leading-tight">
              {shots}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            aria-label="How to play"
            className="w-8 h-8 ml-1 pointer-events-auto flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 text-white/70 hover:text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Combo Multiplier Banner */}
      {combo && combo.multiplier >= 2 && (
        <div
          key={combo.timestamp}
          className="pointer-events-auto flex flex-col items-center animate-combo-pop"
        >
          <div
            className="relative flex items-center gap-2 px-3 py-1 rounded-full border shadow-lg backdrop-blur-md overflow-hidden"
            style={{
              backgroundColor: 'rgba(12, 8, 26, 0.88)',
              borderColor: `${combo.color}66`,
              boxShadow: `0 0 16px ${combo.color}44`,
            }}
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" style={{ color: combo.color }} />
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className="px-1.5 py-0.2 rounded text-xs font-black font-mono tracking-tight text-black"
                style={{ backgroundColor: combo.color }}
              >
                {combo.multiplier}x
              </span>
              <span className="text-[11px] uppercase tracking-wider text-white font-extrabold">
                {combo.title}
              </span>
              <span className="text-[10px] text-white/70 font-semibold">
                ({combo.count} Popped!)
              </span>
            </div>

            {/* Depleting timer bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: combo.color,
                  animation: `comboDeplete ${combo.duration}s linear forwards`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
