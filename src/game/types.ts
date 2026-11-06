export type PowerUpType = 'NONE' | 'BOMB' | 'RAINBOW';

export interface Bubble {
  ring: number;
  slot: number;
  color: string;
  powerUp?: PowerUpType;
  popProgress?: number; // for squash/pop animation
  scale?: number;
}

export interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  powerUp?: PowerUpType;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
  age: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  color: string;
  size: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  age: number;
  scale: number;
}

export interface LevelData {
  idx: number;
  name: string;
  colors: number;
  angVel: number;
  bubbles: Bubble[];
  tier: string;
  tierColor: string;
}

export interface SaveData {
  completed: number[];
  bestScore: Record<number, number>;
  soundEnabled: boolean;
}

export type GameScreen = 'SPLASH' | 'MENU' | 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER' | 'HOW_TO_PLAY';

export interface GameStats {
  score: number;
  shots: number;
  levelIdx: number;
  comboCount: number;
  highScore: number;
}

export interface ComboState {
  multiplier: number;
  count: number;
  title: string;
  color: string;
  duration: number;
  timestamp: number;
}
