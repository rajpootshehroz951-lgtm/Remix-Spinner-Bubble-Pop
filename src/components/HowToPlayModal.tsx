import React from 'react';
import { ArrowLeft, Target, RotateCw, Sparkles, ShieldAlert, CornerUpRight, Bomb, Zap, Flame } from 'lucide-react';
import { sound } from '../game/sound';

interface HowToPlayModalProps {
  onBack: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-3 sm:p-4 bg-[#05020f]/95 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center my-auto py-2">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
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
            How to Play
          </h2>

          <div className="w-16" />
        </div>

        {/* Feature Cards */}
        <div className="w-full flex flex-col gap-2 mb-3">
          {/* Bomb Bubble Power-Up */}
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/25 text-rose-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <Bomb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-xs font-bold text-white">Bomb Bubble Power-Up</h3>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 font-bold">Special</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Detonates on contact! Obliterates surrounding bubble clusters in a fiery radius blast and triggers massive cascading falloffs.
              </p>
            </div>
          </div>

          {/* Rainbow Bubble Power-Up */}
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/30 via-yellow-400/30 to-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(107,227,255,0.3)]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-xs font-bold text-white">Rainbow Bubble Wildcard</h3>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200 font-bold">Special</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Matches with any color! Clears all connected color chains simultaneously or stays on the wheel as a permanent wildcard connector.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#6be3ff]/20 text-[#6be3ff] flex items-center justify-center shrink-0">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white mb-0.5">Spin Physics</h3>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Projectiles transfer rotational momentum on impact. Hitting the left or right side spins the cluster to reveal hidden colors!
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ff5c8a]/20 text-[#ff5c8a] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white mb-0.5">Match 3+ Combo</h3>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Aim and hit identical colors. Connecting three or more bubbles pops them with particle explosions and score points.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#ffd36b]/10 border border-[#ffd36b]/25 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ffd36b]/25 text-[#ffd36b] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,211,107,0.3)]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-xs font-bold text-white">Combo Multipliers</h3>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#ffd36b]/30 text-[#ffd36b] font-bold">2x – 8x</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Popping 4 or more bubbles in a single shot chain reaction triggers massive score multipliers (2x to 8x)! Watch the multiplier banner in your HUD.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ffd36b]/20 text-[#ffd36b] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white mb-0.5">Cascade Chain Reactions</h3>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Disconnected bubbles fall off automatically for multiplier points and add bonus energy to your Power-Up charge gauge!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#8aff6b]/20 text-[#8aff6b] flex items-center justify-center shrink-0">
              <CornerUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white mb-0.5">Bank Shots</h3>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Shots bounce off side borders with accurate rebound angles. Use banks to thread bubbles into tight spots.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white mb-0.5">Danger Threshold</h3>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Do not allow any bubble to expand past the bottom dashed line or you will trigger a Cluster Breach!
              </p>
            </div>
          </div>
        </div>

        {/* Controls Summary */}
        <div className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-white/70">
          <span className="font-semibold text-white">Controls:</span> Drag or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">A / D</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Arrows</kbd> to aim, release or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Space</kbd> to shoot.
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="w-full mt-3 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#ff6ec7] to-[#8a5cff] text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all"
        >
          Got It, Let&apos;s Play
        </button>
      </div>
    </div>
  );
};
