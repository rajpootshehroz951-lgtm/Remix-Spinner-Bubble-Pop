import { Bubble, LevelData } from './types';

export const COLORS = [
  '#ff5c8a', // vibrant coral pink
  '#6be3ff', // electric cyan
  '#ffd36b', // neon gold
  '#8aff6b', // lime green
  '#c58aff', // violet orchid
  '#ff9a5c', // bright sunset orange
];

export const TOTAL_LEVELS = 200;
export const LEVELS_PER_PAGE = 20;
export const TOTAL_PAGES = Math.ceil(TOTAL_LEVELS / LEVELS_PER_PAGE);

// Safe 32-bit PRNG
export function mulberry32(seed: number) {
  return function() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = t ^ Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rndColor(rng: () => number, n: number): string {
  return COLORS[Math.floor(rng() * n)];
}

const ADJ = [
  'Swift', 'Wild', 'Crazy', 'Mighty', 'Grand', 'Mystic', 'Silent', 'Rapid', 'Fierce', 'Gentle',
  'Bright', 'Dark', 'Cosmic', 'Lunar', 'Solar', 'Crystal', 'Golden', 'Silver', 'Ruby', 'Jade',
  'Frozen', 'Blazing', 'Shadow', 'Neon', 'Velvet', 'Thunder', 'Iron', 'Emerald', 'Sapphire', 'Amber',
  'Twisted', 'Smooth', 'Stealth', 'Epic', 'Tiny', 'Mega', 'Ultra', 'Hyper', 'Super', 'Omega'
];

const NOUN = [
  'Spin', 'Pop', 'Burst', 'Loop', 'Ring', 'Wave', 'Storm', 'Flash', 'Pulse', 'Drift',
  'Vortex', 'Orbit', 'Flux', 'Glide', 'Bounce', 'Twirl', 'Dance', 'Rush', 'Flow', 'Blast',
  'Maze', 'Grid', 'Field', 'Zone', 'Realm', 'Peak', 'Edge', 'Core', 'Halo', 'Arc'
];

export function levelName(idx: number): string {
  const rng = mulberry32(idx * 9973 + 1337);
  return ADJ[Math.floor(rng() * ADJ.length)] + ' ' + NOUN[Math.floor(rng() * NOUN.length)];
}

export function tierColor(idx: number): string {
  if (idx < 20) return '#8aff6b';
  if (idx < 50) return '#6be3ff';
  if (idx < 100) return '#ffd36b';
  if (idx < 150) return '#ff9a5c';
  return '#ff5c8a';
}

export function tierName(idx: number): string {
  if (idx < 20) return 'Beginner';
  if (idx < 50) return 'Rising';
  if (idx < 100) return 'Expert';
  if (idx < 150) return 'Master';
  return 'Legend';
}

function patternFull(rng: () => number, maxRing: number, nColors: number): Bubble[] {
  const out: Bubble[] = [{ ring: 0, slot: 0, color: rndColor(rng, nColors) }];
  for (let r = 1; r <= maxRing; r++) {
    const n = 6 * r;
    for (let s = 0; s < n; s++) {
      out.push({ ring: r, slot: s, color: rndColor(rng, nColors) });
    }
  }
  return out;
}

function patternHollow(rng: () => number, maxRing: number, nColors: number): Bubble[] {
  const out: Bubble[] = [];
  for (let r = 1; r <= maxRing; r++) {
    const n = 6 * r;
    for (let s = 0; s < n; s++) {
      out.push({ ring: r, slot: s, color: rndColor(rng, nColors) });
    }
  }
  return out;
}

function patternSpiral(rng: () => number, maxRing: number, nColors: number): Bubble[] {
  const out: Bubble[] = [{ ring: 0, slot: 0, color: rndColor(rng, nColors) }];
  for (let r = 1; r <= maxRing; r++) {
    const n = 6 * r;
    for (let s = 0; s < n; s++) {
      if ((s + r) % 3 === 0) {
        out.push({ ring: r, slot: s, color: rndColor(rng, nColors) });
      }
    }
  }
  return out;
}

function patternChecker(rng: () => number, maxRing: number, nColors: number): Bubble[] {
  const out: Bubble[] = [{ ring: 0, slot: 0, color: rndColor(rng, nColors) }];
  for (let r = 1; r <= maxRing; r++) {
    const n = 6 * r;
    for (let s = 0; s < n; s++) {
      if ((s + r) % 2 === 0) {
        out.push({ ring: r, slot: s, color: rndColor(rng, nColors) });
      }
    }
  }
  return out;
}

function patternScatter(rng: () => number, maxRing: number, nColors: number, density: number): Bubble[] {
  const out: Bubble[] = [{ ring: 0, slot: 0, color: rndColor(rng, nColors) }];
  for (let r = 1; r <= maxRing; r++) {
    const n = 6 * r;
    for (let s = 0; s < n; s++) {
      if (rng() < density) {
        out.push({ ring: r, slot: s, color: rndColor(rng, nColors) });
      }
    }
  }
  return out;
}

function patternDiamond(rng: () => number, maxRing: number, nColors: number): Bubble[] {
  const out: Bubble[] = [{ ring: 0, slot: 0, color: rndColor(rng, nColors) }];
  for (let r = 1; r <= maxRing; r++) {
    const n = 6 * r;
    for (let a = 0; a < 4; a++) {
      const s = Math.round((a / 4) * n) % n;
      out.push({ ring: r, slot: s, color: rndColor(rng, nColors) });
      if (r > 1) {
        out.push({ ring: r, slot: (s + 1) % n, color: rndColor(rng, nColors) });
      }
    }
  }
  return out;
}

function patternRing(rng: () => number, targetRing: number, nColors: number): Bubble[] {
  const out: Bubble[] = [];
  const n = 6 * targetRing;
  for (let s = 0; s < n; s++) {
    out.push({ ring: targetRing, slot: s, color: rndColor(rng, nColors) });
  }
  return out;
}

function patternArms(rng: () => number, maxRing: number, nColors: number, armCount: number): Bubble[] {
  const out: Bubble[] = [{ ring: 0, slot: 0, color: rndColor(rng, nColors) }];
  for (let r = 1; r <= maxRing; r++) {
    const n = 6 * r;
    for (let a = 0; a < armCount; a++) {
      const s = Math.round((a / armCount) * n) % n;
      out.push({ ring: r, slot: s, color: rndColor(rng, nColors) });
    }
  }
  return out;
}

export function generateLevel(idx: number): LevelData {
  const rng = mulberry32(idx * 7919 + 42);
  let nColors: number;
  let angVel: number;
  let maxRing: number;
  let pattern: string;
  let density = 0.6;

  if (idx < 20) {
    nColors = 3;
    angVel = 0.3 + (idx / (TOTAL_LEVELS - 1)) * 0.8;
    maxRing = 1 + Math.floor(idx / 7);
    const pats1 = ['full', 'hollow', 'diamond'];
    pattern = pats1[Math.floor(rng() * pats1.length)];
  } else if (idx < 50) {
    nColors = 3 + Math.floor((idx - 20) / 15);
    angVel = 0.5 + (idx - 20) / 60;
    maxRing = 2 + Math.floor((idx - 20) / 15);
    const pats2 = ['full', 'spiral', 'checker', 'diamond', 'arms'];
    pattern = pats2[Math.floor(rng() * pats2.length)];
  } else if (idx < 100) {
    nColors = 4 + Math.floor((idx - 50) / 25);
    angVel = 0.8 + (idx - 50) / 80;
    maxRing = 3 + Math.floor((idx - 50) / 25);
    const pats3 = ['full', 'spiral', 'checker', 'scatter', 'diamond', 'arms'];
    pattern = pats3[Math.floor(rng() * pats3.length)];
    density = 0.5 + rng() * 0.4;
  } else if (idx < 150) {
    nColors = 5 + Math.floor((idx - 100) / 50);
    angVel = 1.2 + (idx - 100) / 60;
    maxRing = 3 + Math.floor((idx - 100) / 25);
    const pats4 = ['full', 'spiral', 'checker', 'scatter', 'arms', 'ring'];
    pattern = pats4[Math.floor(rng() * pats4.length)];
    density = 0.4 + rng() * 0.5;
  } else {
    nColors = 6;
    angVel = 1.8 + (idx - 150) / 50;
    maxRing = 4 + Math.floor((idx - 150) / 25);
    const pats5 = ['full', 'spiral', 'checker', 'scatter', 'arms'];
    pattern = pats5[Math.floor(rng() * pats5.length)];
    density = 0.5 + rng() * 0.45;
  }

  nColors = Math.min(6, Math.max(3, nColors));
  angVel = Math.min(3.5, Math.max(0.3, angVel));
  maxRing = Math.min(5, Math.max(1, maxRing));

  let bubbles: Bubble[];
  if (pattern === 'full') bubbles = patternFull(rng, maxRing, nColors);
  else if (pattern === 'hollow') bubbles = patternHollow(rng, maxRing, nColors);
  else if (pattern === 'spiral') bubbles = patternSpiral(rng, maxRing, nColors);
  else if (pattern === 'checker') bubbles = patternChecker(rng, maxRing, nColors);
  else if (pattern === 'scatter') bubbles = patternScatter(rng, maxRing, nColors, density);
  else if (pattern === 'diamond') bubbles = patternDiamond(rng, maxRing, nColors);
  else if (pattern === 'arms') bubbles = patternArms(rng, maxRing, nColors, 3 + Math.floor(rng() * 4));
  else if (pattern === 'ring') bubbles = patternRing(rng, maxRing, nColors);
  else bubbles = patternFull(rng, maxRing, nColors);

  if (idx === 0) {
    bubbles = [{ ring: 0, slot: 0, color: rndColor(rng, 3) }];
    for (let s = 0; s < 6; s++) {
      bubbles.push({ ring: 1, slot: s, color: rndColor(rng, 3) });
    }
    angVel = 0.3;
  } else if (idx === TOTAL_LEVELS - 1) {
    bubbles = patternFull(rng, 5, 6);
    angVel = 2.2;
  }

  return {
    idx,
    name: levelName(idx),
    colors: nColors,
    angVel,
    bubbles,
    tier: tierName(idx),
    tierColor: tierColor(idx),
  };
}

const levelCache: Record<number, LevelData> = {};
export function getLevel(idx: number): LevelData {
  if (!levelCache[idx]) {
    levelCache[idx] = generateLevel(idx);
  }
  return levelCache[idx];
}

export function shadeHex(hex: string, amt: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const f = Math.abs(amt);
  let nr: number, ng: number, nb: number;
  if (amt >= 0) {
    nr = Math.round(r + (255 - r) * f);
    ng = Math.round(g + (255 - g) * f);
    nb = Math.round(b + (255 - b) * f);
  } else {
    nr = Math.round(r * (1 - f));
    ng = Math.round(g * (1 - f));
    nb = Math.round(b * (1 - f));
  }
  return `rgb(${nr},${ng},${nb})`;
}
