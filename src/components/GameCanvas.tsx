import React, { useEffect, useRef, useCallback } from 'react';
import { Bubble, FlyingBubble, Particle, FloatingText, PowerUpType, Shockwave, ComboState } from '../game/types';
import { getLevel, rndColor, shadeHex } from '../game/levels';
import { sound } from '../game/sound';

export function getComboTier(totalPopped: number): { multiplier: number; title: string; color: string } {
  if (totalPopped >= 14) return { multiplier: 8, title: 'HYPER COMBO', color: '#ff6ec7' };
  if (totalPopped >= 11) return { multiplier: 5, title: 'ULTRA COMBO', color: '#c58aff' };
  if (totalPopped >= 8) return { multiplier: 4, title: 'MEGA COMBO', color: '#ff5c8a' };
  if (totalPopped >= 6) return { multiplier: 3, title: 'SUPER COMBO', color: '#ffd36b' };
  if (totalPopped >= 4) return { multiplier: 2, title: 'GREAT COMBO', color: '#6be3ff' };
  return { multiplier: 1, title: '', color: '#ffffff' };
}

interface GameCanvasProps {
  levelIdx: number;
  isPlaying: boolean;
  onScoreUpdate: (score: number, shots: number) => void;
  onComboUpdate?: (combo: ComboState | null) => void;
  onLevelComplete: (score: number, shots: number) => void;
  onGameOver: (score: number, shots: number) => void;
  onPause: () => void;
  onRestart: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelIdx,
  isPlaying,
  onScoreUpdate,
  onComboUpdate,
  onLevelComplete,
  onGameOver,
  onPause,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable game simulation state preserved across render ticks without React re-render lag
  const simRef = useRef({
    W: 400,
    H: 700,
    CX: 200,
    CY: 224,
    R: 20,
    spinner: {
      angle: 0,
      angVel: 0.5,
      bubbles: [] as Bubble[],
    },
    shooter: {
      angle: -Math.PI / 2,
      color: '#ff5c8a',
      powerUp: 'NONE' as PowerUpType,
    },
    flying: null as FlyingBubble | null,
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    shockwaves: [] as Shockwave[],
    textCounter: 0,
    aim: null as { x: number; y: number } | null,
    score: 0,
    shots: 0,
    colorPool: 3,
    nextQueue: [] as { color: string; powerUp: PowerUpType }[],
    powerUpMeter: 1,
    powerUpTarget: 5,
    powerUpCount: 0,
    combo: null as (ComboState & { timeLeft: number }) | null,
    gameOver: false,
    won: false,
    screenShake: 0,
    hitstop: 0,
    heldKeys: { left: false, right: false },
  });

  const levelIdxRef = useRef(levelIdx);
  levelIdxRef.current = levelIdx;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Initialize or reset level state
  const resetLevel = useCallback((idx: number) => {
    const lvl = getLevel(idx);
    const sim = simRef.current;
    sim.gameOver = false;
    sim.won = false;
    sim.score = 0;
    sim.shots = 0;
    sim.flying = null;
    sim.particles = [];
    sim.floatingTexts = [];
    sim.shockwaves = [];
    sim.colorPool = lvl.colors;
    sim.screenShake = 0;
    sim.hitstop = 0;
    sim.powerUpMeter = 1;
    sim.powerUpTarget = 5;
    sim.powerUpCount = 0;
    sim.combo = null;
    onComboUpdate?.(null);
    sim.shooter.angle = -Math.PI / 2;
    sim.shooter.color = rndColor(Math.random, lvl.colors);
    sim.shooter.powerUp = 'NONE';
    sim.nextQueue = [
      { color: rndColor(Math.random, lvl.colors), powerUp: 'NONE' },
      { color: rndColor(Math.random, lvl.colors), powerUp: 'NONE' },
      { color: rndColor(Math.random, lvl.colors), powerUp: 'NONE' },
    ];
    sim.spinner.angle = 0;
    sim.spinner.angVel = lvl.angVel;
    sim.spinner.bubbles = lvl.bubbles.map((b) => ({
      ring: b.ring,
      slot: b.slot,
      color: b.color,
      powerUp: b.powerUp || 'NONE',
      scale: 1,
    }));

    onScoreUpdate(0, 0);
  }, [onScoreUpdate, onComboUpdate]);

  useEffect(() => {
    resetLevel(levelIdx);
  }, [levelIdx, resetLevel]);

  // Spatial coordinate helper for hexagonal concentric rings
  const getBubblePos = (b: { ring: number; slot: number }, spinnerAngle: number) => {
    const sim = simRef.current;
    if (b.ring === 0) return { x: sim.CX, y: sim.CY };
    const slotsInRing = 6 * b.ring;
    const baseAngle = (b.slot / slotsInRing) * Math.PI * 2;
    const r = b.ring * sim.R * 1.82;
    const a = baseAngle + spinnerAngle;
    return {
      x: sim.CX + Math.cos(a) * r,
      y: sim.CY + Math.sin(a) * r,
    };
  };

  // Find nearest empty hexagonal slot
  const findNearestEmptySlot = (px: number, py: number) => {
    const sim = simRef.current;
    const s = sim.spinner;
    const occupied: Record<string, boolean> = {};
    for (const b of s.bubbles) {
      occupied[`${b.ring}:${b.slot}`] = true;
    }
    let best = null;
    let bestDist = Infinity;
    for (let ring = 1; ring <= 6; ring++) {
      const n = 6 * ring;
      for (let slot = 0; slot < n; slot++) {
        const key = `${ring}:${slot}`;
        if (occupied[key]) continue;
        const p = getBubblePos({ ring, slot }, s.angle);
        const dx = p.x - px;
        const dy = p.y - py;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = { ring, slot };
        }
      }
    }
    return best;
  };

  // Hexagonal neighbors lookup
  const getNeighbors = (b: { ring: number; slot: number }) => {
    const out: { ring: number; slot: number }[] = [];
    if (b.ring === 0) {
      for (let i = 0; i < 6; i++) out.push({ ring: 1, slot: i });
      return out;
    }
    const n = 6 * b.ring;
    out.push({ ring: b.ring, slot: (b.slot + 1) % n });
    out.push({ ring: b.ring, slot: (b.slot - 1 + n) % n });
    if (b.ring > 1) {
      const innerN = 6 * (b.ring - 1);
      const myAngle = (b.slot / n) * Math.PI * 2;
      const s1 = Math.round((myAngle / (Math.PI * 2)) * innerN) % innerN;
      const s2 = (s1 + 1) % innerN;
      out.push({ ring: b.ring - 1, slot: s1 });
      out.push({ ring: b.ring - 1, slot: s2 });
    } else {
      out.push({ ring: 0, slot: 0 });
    }
    const outerN = 6 * (b.ring + 1);
    const myAngle2 = (b.slot / n) * Math.PI * 2;
    const s1o = Math.round((myAngle2 / (Math.PI * 2)) * outerN) % outerN;
    const s2o = (s1o + 1) % outerN;
    out.push({ ring: b.ring + 1, slot: s1o });
    out.push({ ring: b.ring + 1, slot: s2o });
    return out;
  };

  const findBubble = (ring: number, slot: number) => {
    return simRef.current.spinner.bubbles.find((b) => b.ring === ring && b.slot === slot) || null;
  };

  const findMatches = (startBubble: Bubble) => {
    const color = startBubble.color;
    const isStartRainbow = startBubble.powerUp === 'RAINBOW';
    const visited: Record<string, boolean> = {};
    const queue: Bubble[] = [startBubble];
    const keyOf = (b: { ring: number; slot: number }) => `${b.ring}:${b.slot}`;
    visited[keyOf(startBubble)] = true;
    const result: Bubble[] = [startBubble];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const neighbors = getNeighbors(cur);
      for (const nb of neighbors) {
        const k = `${nb.ring}:${nb.slot}`;
        if (visited[k]) continue;
        const found = findBubble(nb.ring, nb.slot);
        if (!found) continue;

        // Matches if identical color OR if either bubble is a Rainbow wildcard
        const isMatch = isStartRainbow
          ? true
          : found.color === color || found.powerUp === 'RAINBOW';

        if (isMatch) {
          visited[k] = true;
          result.push(found);
          queue.push(found);
        }
      }
    }
    return result;
  };

  const findRainbowMatches = (rainbowBubble: Bubble): Bubble[] => {
    const neighbors = getNeighbors(rainbowBubble);
    const matchedKeys = new Set<string>();
    const allMatched: Bubble[] = [];

    // Identify all unique colors bordering the rainbow bubble
    const neighborColors = new Set<string>();
    for (const nb of neighbors) {
      const b = findBubble(nb.ring, nb.slot);
      if (b && b !== rainbowBubble && b.powerUp !== 'RAINBOW') {
        neighborColors.add(b.color);
      }
    }

    for (const color of neighborColors) {
      const visited: Record<string, boolean> = { [`${rainbowBubble.ring}:${rainbowBubble.slot}`]: true };
      const queue: Bubble[] = [rainbowBubble];
      const group: Bubble[] = [rainbowBubble];

      while (queue.length > 0) {
        const cur = queue.shift()!;
        const curNeighbors = getNeighbors(cur);
        for (const nb of curNeighbors) {
          const k = `${nb.ring}:${nb.slot}`;
          if (visited[k]) continue;
          const found = findBubble(nb.ring, nb.slot);
          if (!found) continue;
          if (found.color === color || found.powerUp === 'RAINBOW') {
            visited[k] = true;
            group.push(found);
            queue.push(found);
          }
        }
      }

      // If rainbow + at least 2 matching color bubbles => forms match-3 or more!
      if (group.length >= 3) {
        for (const b of group) {
          const k = `${b.ring}:${b.slot}`;
          if (!matchedKeys.has(k)) {
            matchedKeys.add(k);
            allMatched.push(b);
          }
        }
      }
    }

    return allMatched;
  };

  const spawnParticles = (x: number, y: number, color: string, count = 14) => {
    const sim = simRef.current;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 220;
      sim.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5 + Math.random() * 0.4,
        age: 0,
        color,
        size: 2.5 + Math.random() * 3.5,
      });
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color = '#ffd36b') => {
    const sim = simRef.current;
    sim.textCounter++;
    sim.floatingTexts.push({
      id: sim.textCounter,
      text,
      x,
      y,
      color,
      life: 0.8,
      age: 0,
      scale: 1,
    });
  };

  const shoot = useCallback(() => {
    const sim = simRef.current;
    if (!isPlayingRef.current || sim.flying || sim.gameOver || sim.won) return;

    sound.playShoot();
    const sx = sim.CX;
    const sy = sim.H - 60;
    const speed = 920;

    sim.flying = {
      x: sx,
      y: sy,
      vx: Math.cos(sim.shooter.angle) * speed,
      vy: Math.sin(sim.shooter.angle) * speed,
      color: sim.shooter.color,
      powerUp: sim.shooter.powerUp,
    };

    sim.shots++;
    sim.powerUpMeter++;

    // Shift next bubble from queue
    const nextItem = sim.nextQueue.shift() || { color: rndColor(Math.random, sim.colorPool), powerUp: 'NONE' };
    sim.shooter.color = nextItem.color;
    sim.shooter.powerUp = nextItem.powerUp;

    if (nextItem.powerUp !== 'NONE') {
      sound.playPowerUpReady();
      const pLabel = nextItem.powerUp === 'BOMB' ? '💥 BOMB ARMED!' : '🌈 RAINBOW ARMED!';
      const pColor = nextItem.powerUp === 'BOMB' ? '#ff4d4d' : '#6be3ff';
      addFloatingText(pLabel, sim.CX, sim.H - 95, pColor);
    }

    // Refill queue: check if periodic power-up should be queued
    if (sim.powerUpMeter >= sim.powerUpTarget) {
      sim.powerUpMeter = 0;
      const pType: PowerUpType = sim.powerUpCount % 2 === 0 ? 'BOMB' : 'RAINBOW';
      sim.powerUpCount++;
      sim.nextQueue.push({
        color: pType === 'BOMB' ? '#ff3b30' : '#ffffff',
        powerUp: pType,
      });
      addFloatingText(`⚡ ${pType} QUEUED!`, sim.CX, sim.H - 120, '#ffd36b');
    } else {
      sim.nextQueue.push({
        color: rndColor(Math.random, sim.colorPool),
        powerUp: 'NONE',
      });
    }

    onScoreUpdate(sim.score, sim.shots);
  }, [onScoreUpdate]);

  const detonateBomb = (flying: FlyingBubble, hitBubble: Bubble) => {
    const sim = simRef.current;
    const s = sim.spinner;
    const hitPos = getBubblePos(hitBubble, s.angle);

    sound.playBomb();
    sim.screenShake = 22;
    sim.hitstop = 0.08;

    // Expanding fiery shockwaves
    sim.shockwaves.push({
      x: hitPos.x,
      y: hitPos.y,
      radius: 10,
      maxRadius: sim.R * 4.6,
      color: '#ff3b30',
      lineWidth: 5,
      age: 0,
      life: 0.45,
    });
    sim.shockwaves.push({
      x: hitPos.x,
      y: hitPos.y,
      radius: 5,
      maxRadius: sim.R * 3.2,
      color: '#ffd36b',
      lineWidth: 4,
      age: 0,
      life: 0.35,
    });

    // Massive fiery explosion particles
    const blastColors = ['#ff3b30', '#ff9500', '#ffd36b', '#ffffff', '#ff5c8a'];
    for (let i = 0; i < 38; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 90 + Math.random() * 320;
      sim.particles.push({
        x: hitPos.x,
        y: hitPos.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5 + Math.random() * 0.45,
        age: 0,
        color: blastColors[Math.floor(Math.random() * blastColors.length)],
        size: 3 + Math.random() * 4,
      });
    }

    // Blast radius covers the hit bubble and all bubbles within ~3.3 bubble radii
    const blastRadius = sim.R * 3.3;
    const blastRadiusSq = blastRadius * blastRadius;
    const destroyed: Bubble[] = [];
    const kept: Bubble[] = [];

    for (const b of s.bubbles) {
      if (b.ring === hitBubble.ring && b.slot === hitBubble.slot) {
        destroyed.push(b);
        continue;
      }
      const bp = getBubblePos(b, s.angle);
      const dx = bp.x - hitPos.x;
      const dy = bp.y - hitPos.y;
      if (dx * dx + dy * dy <= blastRadiusSq) {
        destroyed.push(b);
      } else {
        kept.push(b);
      }
    }

    for (const b of destroyed) {
      const bp = getBubblePos(b, s.angle);
      spawnParticles(bp.x, bp.y, b.powerUp === 'BOMB' ? '#ff3b30' : b.color, 8);
    }

    s.bubbles = kept;

    // Angular momentum transfer
    const rx = hitPos.x - sim.CX;
    const ry = hitPos.y - sim.CY;
    const cross = rx * flying.vy - ry * flying.vx;
    s.angVel += cross * 0.000025;
    s.angVel = Math.max(-14, Math.min(14, s.angVel));

    // Calculate chain reaction (blast + cascading floaters)
    const cascade = removeFloating(hitPos.x, hitPos.y);
    processChainReaction(
      destroyed.length,
      destroyed.length * 35 + 100,
      cascade.count,
      cascade.baseBonus,
      hitPos.x,
      hitPos.y,
      '#ff4d4d'
    );
  };

  const processChainReaction = (
    initialCount: number,
    initialBaseScore: number,
    cascadeCount: number,
    cascadeBaseScore: number,
    burstX: number,
    burstY: number,
    accentColor: string
  ) => {
    const sim = simRef.current;
    const totalPopped = initialCount + cascadeCount;
    const totalBaseScore = initialBaseScore + cascadeBaseScore;
    const tier = getComboTier(totalPopped);
    const multiplier = tier.multiplier;
    const finalScore = totalBaseScore * multiplier;

    sim.score += finalScore;

    if (multiplier >= 2) {
      sound.playCombo(multiplier);
      sim.screenShake = Math.min(26, sim.screenShake + multiplier * 2.6);

      const comboData: ComboState = {
        multiplier,
        count: totalPopped,
        title: tier.title,
        color: tier.color,
        duration: 4.5,
        timestamp: Date.now(),
      };
      sim.combo = {
        ...comboData,
        timeLeft: 4.5,
      };
      onComboUpdate?.(comboData);

      // Flashy floating text announcing combo multiplier
      addFloatingText(
        `🔥 ${tier.title} ${multiplier}x! +${finalScore}`,
        burstX,
        burstY - 24,
        tier.color
      );
      if (cascadeCount > 0) {
        addFloatingText(
          `+${cascadeCount} CASCADE (${multiplier}x)`,
          burstX,
          burstY - 8,
          '#6be3ff'
        );
      }
    } else {
      if (cascadeCount > 0) {
        addFloatingText(`+${finalScore} CASCADE!`, burstX, burstY - 14, '#6be3ff');
      } else {
        addFloatingText(`+${finalScore}`, burstX, burstY - 12, accentColor);
      }
    }

    onScoreUpdate(sim.score, sim.shots);
  };

  const attachBubble = (flying: FlyingBubble) => {
    const sim = simRef.current;
    const s = sim.spinner;
    const slot = findNearestEmptySlot(flying.x, flying.y);
    if (!slot) return;

    sound.playAttach();
    const isRainbow = flying.powerUp === 'RAINBOW';
    const newB: Bubble = {
      ring: slot.ring,
      slot: slot.slot,
      color: isRainbow ? '#ffffff' : flying.color,
      powerUp: flying.powerUp || 'NONE',
      scale: 1.3,
    };
    s.bubbles.push(newB);

    // Angular momentum transfer
    const p = getBubblePos(newB, s.angle);
    const rx = p.x - sim.CX;
    const ry = p.y - sim.CY;
    const cross = rx * flying.vy - ry * flying.vx;
    s.angVel += cross * 0.000014;
    s.angVel = Math.max(-12, Math.min(12, s.angVel));

    // Match 3 check
    if (isRainbow) {
      const matches = findRainbowMatches(newB);
      if (matches.length > 0) {
        sound.playRainbow();
        sim.screenShake = 16;
        sim.hitstop = 0.05;

        // Prismatic shockwaves
        sim.shockwaves.push({
          x: p.x,
          y: p.y,
          radius: 10,
          maxRadius: sim.R * 3.8,
          color: '#6be3ff',
          lineWidth: 4,
          age: 0,
          life: 0.45,
        });
        sim.shockwaves.push({
          x: p.x,
          y: p.y,
          radius: 5,
          maxRadius: sim.R * 2.8,
          color: '#ff6ec7',
          lineWidth: 3,
          age: 0,
          life: 0.35,
        });

        // Prismatic sparkle particles
        const spectrum = ['#ff5c8a', '#6be3ff', '#ffd36b', '#8aff6b', '#c58aff', '#ffffff'];
        for (const m of matches) {
          const mp = getBubblePos(m, s.angle);
          for (let k = 0; k < 12; k++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 80 + Math.random() * 240;
            sim.particles.push({
              x: mp.x,
              y: mp.y,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp,
              life: 0.5 + Math.random() * 0.4,
              age: 0,
              color: spectrum[Math.floor(Math.random() * spectrum.length)],
              size: 2.5 + Math.random() * 3.5,
            });
          }
        }

        const matchKeys: Record<string, boolean> = {};
        for (const m of matches) {
          matchKeys[`${m.ring}:${m.slot}`] = true;
        }
        s.bubbles = s.bubbles.filter((b) => !matchKeys[`${b.ring}:${b.slot}`]);

        const cascade = removeFloating(p.x, p.y);
        processChainReaction(
          matches.length,
          matches.length * 25 + 80,
          cascade.count,
          cascade.baseBonus,
          p.x,
          p.y,
          '#6be3ff'
        );
      } else {
        addFloatingText('🌈 WILDCARD SET!', p.x, p.y - 12, '#ffd36b');
      }
    } else {
      const matches = findMatches(newB);
      if (matches.length >= 3) {
        sound.playPop(matches.length - 2);
        sim.screenShake = Math.min(12, matches.length * 2.5);
        sim.hitstop = 0.04;

        for (const m of matches) {
          const mp = getBubblePos(m, s.angle);
          spawnParticles(mp.x, mp.y, m.powerUp === 'RAINBOW' ? '#6be3ff' : m.color, 12);
        }

        const matchKeys: Record<string, boolean> = {};
        for (const m of matches) {
          matchKeys[`${m.ring}:${m.slot}`] = true;
        }
        s.bubbles = s.bubbles.filter((b) => !matchKeys[`${b.ring}:${b.slot}`]);

        const cascade = removeFloating(p.x, p.y);
        processChainReaction(
          matches.length,
          matches.length * 15 + (matches.length - 3) * 30,
          cascade.count,
          cascade.baseBonus,
          p.x,
          p.y,
          matches[0].color
        );
      } else {
        // A miss with no pops cancels active combo streak
        if (sim.combo) {
          sim.combo = null;
          onComboUpdate?.(null);
        }
      }
    }
  };

  const removeFloating = (burstX: number, burstY: number): { count: number; baseBonus: number } => {
    const sim = simRef.current;
    const s = sim.spinner;
    const center = s.bubbles.find((b) => b.ring === 0);
    if (!center) return { count: 0, baseBonus: 0 };

    const visited: Record<string, boolean> = { '0:0': true };
    const queue = [center];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const neighbors = getNeighbors(cur);
      for (const nb of neighbors) {
        const k = `${nb.ring}:${nb.slot}`;
        if (visited[k]) continue;
        const found = findBubble(nb.ring, nb.slot);
        if (!found) continue;
        visited[k] = true;
        queue.push(found);
      }
    }

    const toRemove: Bubble[] = [];
    const toKeep: Bubble[] = [];

    for (const b of s.bubbles) {
      const key = `${b.ring}:${b.slot}`;
      if (visited[key]) {
        toKeep.push(b);
      } else {
        toRemove.push(b);
      }
    }

    if (toRemove.length > 0) {
      sound.playDropFloating();
      sim.screenShake = Math.max(sim.screenShake, 8);
      for (const r of toRemove) {
        const rp = getBubblePos(r, s.angle);
        spawnParticles(rp.x, rp.y, r.color, 8);
      }
      s.bubbles = toKeep;
      const cascadeBonus = toRemove.length * 25;
      if (toRemove.length >= 2) {
        sim.powerUpMeter = Math.min(sim.powerUpTarget, sim.powerUpMeter + 1);
      }
      return { count: toRemove.length, baseBonus: cascadeBonus };
    }
    return { count: 0, baseBonus: 0 };
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const sim = simRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        sim.heldKeys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        sim.heldKeys.right = true;
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        shoot();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPause();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRestart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const sim = simRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        sim.heldKeys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        sim.heldKeys.right = false;
      }
    };

    const handleBlur = () => {
      const sim = simRef.current;
      sim.heldKeys.left = false;
      sim.heldKeys.right = false;
      sim.aim = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [shoot, onPause, onRestart]);

  // Canvas resize and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const maxW = Math.min(window.innerWidth, 480);
      const maxH = window.innerHeight;
      canvas.style.width = `${maxW}px`;
      canvas.style.height = `${maxH}px`;
      canvas.width = Math.floor(maxW * dpr);
      canvas.height = Math.floor(maxH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sim = simRef.current;
      sim.W = maxW;
      sim.H = maxH;
      sim.CX = maxW / 2;
      sim.CY = maxH * 0.33;
      sim.R = Math.min(22, maxW / 18);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    const renderBubble = (
      x: number,
      y: number,
      color: string,
      scale = 1,
      powerUp: PowerUpType = 'NONE',
      animTime = 0
    ) => {
      const sim = simRef.current;
      const r = sim.R * scale;

      if (powerUp === 'BOMB') {
        ctx.save();
        // Fiery pulsing outer glow
        const pulse = Math.sin(animTime * 8);
        const glowColor = pulse > 0 ? 'rgba(255, 60, 40, 0.45)' : 'rgba(255, 120, 20, 0.3)';
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.25, 0, Math.PI * 2);
        ctx.fill();

        // Dark obsidian sphere
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        g.addColorStop(0, '#53435c');
        g.addColorStop(0.5, '#221929');
        g.addColorStop(1, '#0c0712');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Molten fiery core
        const coreR = r * (0.42 + pulse * 0.08);
        const coreG = ctx.createRadialGradient(x, y, 0, x, y, coreR);
        coreG.addColorStop(0, '#fff475');
        coreG.addColorStop(0.5, '#ff6728');
        coreG.addColorStop(1, 'rgba(230, 25, 10, 0.1)');
        ctx.fillStyle = coreG;
        ctx.beginPath();
        ctx.arc(x, y, coreR, 0, Math.PI * 2);
        ctx.fill();

        // Burning fuse & spark at top-right
        const fuseX = x + r * 0.45;
        const fuseY = y - r * 0.45;
        ctx.strokeStyle = '#ffd36b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.25, y - r * 0.25);
        ctx.quadraticCurveTo(fuseX, fuseY - 4, fuseX + 3, fuseY - 2);
        ctx.stroke();

        // Fuse spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fuseX + 3, fuseY - 2, 2.5 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Stylized bomb glyph
        ctx.fillStyle = '#ffd36b';
        ctx.font = `900 ${Math.round(r * 0.72)}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', x, y + 1);

        ctx.restore();
        return;
      }

      if (powerUp === 'RAINBOW') {
        ctx.save();
        // Shimmering outer spectral glow
        ctx.fillStyle = 'rgba(107, 227, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, r * 1.25, 0, Math.PI * 2);
        ctx.fill();

        // Dynamic rotating multi-color gradient
        const rot = animTime * 2.5;
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.2, '#6be3ff');
        g.addColorStop(0.4, '#8aff6b');
        g.addColorStop(0.6, '#ffd36b');
        g.addColorStop(0.8, '#ff5c8a');
        g.addColorStop(1, '#c58aff');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Prismatic glass specular sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Rotating 4-point star in center
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const starR = r * 0.55;
        const innerR = r * 0.16;
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.lineTo(Math.cos(angle) * starR, Math.sin(angle) * starR);
          const halfAngle = angle + Math.PI / 4;
          ctx.lineTo(Math.cos(halfAngle) * innerR, Math.sin(halfAngle) * innerR);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
        return;
      }

      // Regular bubble
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.08, x, y, r);
      g.addColorStop(0, shadeHex(color, 0.45));
      g.addColorStop(0.65, color);
      g.addColorStop(1, shadeHex(color, -0.35));

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Specular glass shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.beginPath();
      ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    };

    const renderTrajectory = (
      sx: number,
      sy: number,
      angle: number,
      color: string,
      powerUp: PowerUpType = 'NONE'
    ) => {
      const sim = simRef.current;
      let x = sx;
      let y = sy;
      let vx = Math.cos(angle);
      const vy = Math.sin(angle);
      const steps = 70;
      const stepDist = 8;

      ctx.save();
      if (powerUp === 'BOMB') {
        ctx.strokeStyle = '#ff4d4d';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.65;
        ctx.setLineDash([5, 5]);
      } else if (powerUp === 'RAINBOW') {
        ctx.strokeStyle = '#6be3ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.65;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([4, 6]);
      }

      ctx.beginPath();
      ctx.moveTo(x, y);

      for (let i = 0; i < steps; i++) {
        x += vx * stepDist;
        y += vy * stepDist;
        if (x < sim.R) {
          x = sim.R;
          vx = -vx;
        }
        if (x > sim.W - sim.R) {
          x = sim.W - sim.R;
          vx = -vx;
        }
        if (y < sim.R) break;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.04, rawDt);
      const animNow = now * 0.001;
      const sim = simRef.current;

      // Handle continuous keyboard aim
      if (sim.heldKeys.left) {
        sim.shooter.angle -= 1.8 * dt;
        if (sim.shooter.angle < -Math.PI + 0.15) sim.shooter.angle = -Math.PI + 0.15;
      }
      if (sim.heldKeys.right) {
        sim.shooter.angle += 1.8 * dt;
        if (sim.shooter.angle > -0.15) sim.shooter.angle = -0.15;
      }

      // Update simulation if active
      if (isPlayingRef.current && !sim.gameOver && !sim.won) {
        if (sim.hitstop > 0) {
          sim.hitstop -= dt;
        } else {
          // Spinner physics
          const s = sim.spinner;
          s.angle += s.angVel * dt;
          s.angVel *= Math.pow(0.72, dt);
          if (Math.abs(s.angVel) < 0.02) s.angVel *= 0.9;

          // Squash-and-stretch settling
          for (const b of s.bubbles) {
            if (b.scale && b.scale > 1) {
              b.scale = Math.max(1, b.scale - dt * 2.5);
            }
          }

          // Flying projectile physics
          const f = sim.flying;
          if (f) {
            f.x += f.vx * dt;
            f.y += f.vy * dt;

            // Bounce off left / right walls
            if (f.x < sim.R) {
              f.x = sim.R;
              f.vx = -f.vx;
              sound.playBounce();
              spawnParticles(f.x, f.y, f.powerUp === 'BOMB' ? '#ff3b30' : f.color, 6);
            }
            if (f.x > sim.W - sim.R) {
              f.x = sim.W - sim.R;
              f.vx = -f.vx;
              sound.playBounce();
              spawnParticles(f.x, f.y, f.powerUp === 'BOMB' ? '#ff3b30' : f.color, 6);
            }

            if (f.y < sim.R) {
              sim.flying = null;
            } else {
              // Collision with spinner bubbles
              let hitBubble: Bubble | null = null;
              let hitDist = Infinity;
              for (const b of s.bubbles) {
                const bp = getBubblePos(b, s.angle);
                const dx = bp.x - f.x;
                const dy = bp.y - f.y;
                const d2 = dx * dx + dy * dy;
                const minD = sim.R * 1.88;
                if (d2 < minD * minD && d2 < hitDist) {
                  hitDist = d2;
                  hitBubble = b;
                }
              }

              if (hitBubble) {
                if (f.powerUp === 'BOMB') {
                  detonateBomb(f, hitBubble);
                } else {
                  attachBubble(f);
                }
                sim.flying = null;
              }
            }
          }

          // Shockwaves update
          const keptShockwaves: Shockwave[] = [];
          for (const sw of sim.shockwaves) {
            sw.age += dt;
            sw.radius += (sw.maxRadius - sw.radius) * (dt * 12);
            if (sw.age < sw.life) {
              keptShockwaves.push(sw);
            }
          }
          sim.shockwaves = keptShockwaves;

          // Particles update
          const keptParticles: Particle[] = [];
          for (const p of sim.particles) {
            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.93;
            p.vy *= 0.93;
            p.vy += 220 * dt; // gravity
            if (p.age < p.life) keptParticles.push(p);
          }
          sim.particles = keptParticles;

          // Floating texts update
          const keptTexts: FloatingText[] = [];
          for (const t of sim.floatingTexts) {
            t.age += dt;
            t.y -= 35 * dt;
            if (t.age < t.life) keptTexts.push(t);
          }
          sim.floatingTexts = keptTexts;

          // Active combo countdown
          if (sim.combo) {
            sim.combo.timeLeft -= dt;
            if (sim.combo.timeLeft <= 0) {
              sim.combo = null;
              onComboUpdate?.(null);
            }
          }

          // Check danger line defeat condition
          const dangerThreshold = sim.H - 100;
          for (const b of s.bubbles) {
            const bp = getBubblePos(b, s.angle);
            if (bp.y > dangerThreshold) {
              sim.gameOver = true;
              sim.combo = null;
              onComboUpdate?.(null);
              sound.playGameOver();
              onGameOver(sim.score, sim.shots);
              break;
            }
          }

          // Check win condition
          if (s.bubbles.length === 0 && !sim.won) {
            sim.won = true;
            sim.combo = null;
            onComboUpdate?.(null);
            sound.playVictory();
            onLevelComplete(sim.score, sim.shots);
          }
        }
      }

      // Camera shake decay
      if (sim.screenShake > 0) {
        sim.screenShake *= Math.pow(0.05, dt);
        if (sim.screenShake < 0.1) sim.screenShake = 0;
      }

      // RENDER
      ctx.save();
      ctx.clearRect(0, 0, sim.W, sim.H);

      // Apply screen shake
      if (sim.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * sim.screenShake * 2;
        const shakeY = (Math.random() - 0.5) * sim.screenShake * 2;
        ctx.translate(shakeX, shakeY);
      }

      // Cosmic background glow
      const bgGrad = ctx.createRadialGradient(sim.CX, sim.CY, 20, sim.CX, sim.CY, Math.max(sim.W, sim.H) * 0.65);
      bgGrad.addColorStop(0, 'rgba(138, 92, 255, 0.18)');
      bgGrad.addColorStop(0.5, 'rgba(26, 16, 64, 0.15)');
      bgGrad.addColorStop(1, 'rgba(5, 2, 15, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, sim.W, sim.H);

      // Center glowing core node
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 211, 107, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sim.CX, sim.CY, sim.R * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // In-canvas Active Combo Badge
      if (sim.combo && sim.combo.timeLeft > 0 && isPlayingRef.current && !sim.gameOver && !sim.won) {
        ctx.save();
        const pulse = 1 + Math.sin(animNow * 8) * 0.05;
        ctx.font = `800 ${Math.round(11 * pulse)}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = sim.combo.color;
        ctx.shadowColor = sim.combo.color;
        ctx.shadowBlur = 8;
        ctx.fillText(
          `🔥 ${sim.combo.title} · ${sim.combo.multiplier}x MULTIPLIER`,
          sim.CX,
          sim.CY - sim.R * 2.3
        );
        ctx.restore();
      }

      // Danger line at H - 100 with pulsing aura
      const dangerY = sim.H - 100;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 92, 138, 0.35)';
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(sim.W, dangerY);
      ctx.stroke();
      ctx.restore();

      // Draw spinner bubbles
      const s = sim.spinner;
      for (const b of s.bubbles) {
        const bp = getBubblePos(b, s.angle);
        renderBubble(bp.x, bp.y, b.color, b.scale || 1, b.powerUp || 'NONE', animNow);
      }

      // Draw flying bubble with motion streak
      if (sim.flying) {
        const f = sim.flying;
        ctx.save();
        ctx.globalAlpha = 0.25;
        renderBubble(f.x - f.vx * 0.012, f.y - f.vy * 0.012, f.color, 0.75, f.powerUp || 'NONE', animNow);
        ctx.globalAlpha = 0.12;
        renderBubble(f.x - f.vx * 0.024, f.y - f.vy * 0.024, f.color, 0.55, f.powerUp || 'NONE', animNow);
        ctx.restore();
        renderBubble(f.x, f.y, f.color, 1, f.powerUp || 'NONE', animNow);
      }

      // Draw shockwaves
      for (const sw of sim.shockwaves) {
        const alpha = Math.max(0, 1 - sw.age / sw.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth * alpha;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw particles
      for (const p of sim.particles) {
        const alpha = Math.max(0, 1 - p.age / p.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw floating score text
      for (const t of sim.floatingTexts) {
        const alpha = Math.max(0, 1 - t.age / t.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      // Shooter aiming trajectory
      const sy = sim.H - 60;
      let aimAngle = sim.shooter.angle;
      if (sim.aim && !sim.flying && !sim.gameOver && !sim.won && isPlayingRef.current) {
        const dx = sim.aim.x - sim.CX;
        const dy = sim.aim.y - sy;
        if (dy < -10) {
          aimAngle = Math.atan2(dy, dx);
          if (aimAngle > -0.15) aimAngle = -0.15;
          if (aimAngle < -Math.PI + 0.15) aimAngle = -Math.PI + 0.15;
          sim.shooter.angle = aimAngle;
        }
      }

      if (!sim.flying && !sim.gameOver && !sim.won && isPlayingRef.current) {
        renderTrajectory(sim.CX, sy, aimAngle, sim.shooter.color, sim.shooter.powerUp);
      }

      // Power-Up Status and Gauge above pedestal
      if (!sim.gameOver && !sim.won && isPlayingRef.current) {
        const gaugeY = sy - sim.R * 2.3;
        const curPowerUp = sim.shooter.powerUp;

        ctx.save();
        if (curPowerUp === 'BOMB') {
          ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ff5c5c';
          ctx.fillText('💣 BOMB ARMED — VAPORIZES CLUSTERS', sim.CX, gaugeY);
        } else if (curPowerUp === 'RAINBOW') {
          ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#6be3ff';
          ctx.fillText('🌈 RAINBOW ARMED — MATCHES ANY COLOR', sim.CX, gaugeY);
        } else {
          // 5-segment energy gauge
          const meterW = 96;
          const meterH = 5;
          const startX = sim.CX - meterW / 2;
          const fillRatio = Math.min(1, sim.powerUpMeter / sim.powerUpTarget);
          const filledW = fillRatio * meterW;

          // Track background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.roundRect(startX, gaugeY - 2, meterW, meterH, 2.5);
          ctx.fill();

          // Energy fill
          if (filledW > 0) {
            const barGrad = ctx.createLinearGradient(startX, 0, startX + filledW, 0);
            barGrad.addColorStop(0, '#ffd36b');
            barGrad.addColorStop(1, '#ff6ec7');
            ctx.fillStyle = barGrad;
            ctx.beginPath();
            ctx.roundRect(startX, gaugeY - 2, filledW, meterH, 2.5);
            ctx.fill();
          }

          // Text label
          const shotsLeft = sim.powerUpTarget - sim.powerUpMeter;
          const nextType = sim.powerUpCount % 2 === 0 ? 'BOMB' : 'RAINBOW';
          ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fillText(`⚡ ${nextType} IN ${shotsLeft} SHOT${shotsLeft === 1 ? '' : 'S'}`, sim.CX, gaugeY - 6);
        }
        ctx.restore();
      }

      // Shooter base pedestal
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sim.CX, sy, sim.R * 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Current active shooter bubble
      if (!sim.gameOver && !sim.won && isPlayingRef.current) {
        renderBubble(sim.CX, sy, sim.shooter.color, 1.15, sim.shooter.powerUp, animNow);
      }

      // Next bubbles queue preview
      if (isPlayingRef.current) {
        for (let i = 0; i < sim.nextQueue.length; i++) {
          const item = sim.nextQueue[i];
          const nx = sim.CX - 56 + i * 28;
          const ny = sim.H - 18;
          renderBubble(nx, ny, item.color, 0.52, item.powerUp, animNow);
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, [attachBubble, onGameOver, onLevelComplete]);

  // Pointer position helper
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    sound.init();
    const pos = getPointerPos(e);
    if (pos) {
      simRef.current.aim = pos;
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPointerPos(e);
    if (pos) {
      simRef.current.aim = pos;
    }
  };

  const handlePointerUp = () => {
    const sim = simRef.current;
    if (sim.aim && sim.aim.y < sim.H - 90) {
      shoot();
    }
    sim.aim = null;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          simRef.current.aim = null;
        }}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={() => {
          simRef.current.aim = null;
        }}
        className="block cursor-crosshair touch-none"
      />
    </div>
  );
};
