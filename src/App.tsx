/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Splash } from './components/Splash';
import { TitleModal } from './components/TitleModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameScreen, SaveData, ComboState } from './game/types';
import { TOTAL_LEVELS } from './game/levels';
import { sound } from './game/sound';

const SAVE_STORAGE_KEY = 'spinnerPop_save_v4';

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.completed)) {
        return {
          completed: parsed.completed,
          bestScore: parsed.bestScore || {},
          soundEnabled: parsed.soundEnabled ?? true,
        };
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return { completed: [], bestScore: {}, soundEnabled: true };
}

function persistSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage write error
  }
}

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<GameScreen>('SPLASH');
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    const saved = loadSave();
    if (saved.completed.length === 0) return 0;
    const maxDone = Math.max(...saved.completed);
    return Math.min(maxDone + 1, TOTAL_LEVELS - 1);
  });
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [combo, setCombo] = useState<ComboState | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [keyCounter, setKeyCounter] = useState(0);

  // Sync initial sound state
  useEffect(() => {
    sound.enabled = saveData.soundEnabled;
  }, [saveData.soundEnabled]);

  const handleToggleSound = useCallback(() => {
    const newState = sound.toggleMute();
    setSaveData((prev) => {
      const updated = { ...prev, soundEnabled: newState };
      persistSave(updated);
      return updated;
    });
  }, []);

  const getNextUnlockedLevel = useCallback(() => {
    if (saveData.completed.length === 0) return 0;
    const maxDone = Math.max(...saveData.completed);
    return Math.min(maxDone + 1, TOTAL_LEVELS - 1);
  }, [saveData.completed]);

  const handleScoreUpdate = useCallback((newScore: number, newShots: number) => {
    setScore(newScore);
    setShots(newShots);
  }, []);

  const handleStartLevel = useCallback((lvlIdx: number) => {
    setCurrentLevel(lvlIdx);
    setScore(0);
    setShots(0);
    setCombo(null);
    setIsNewHighScore(false);
    setKeyCounter((k) => k + 1);
    setScreen('PLAYING');
  }, []);

  const handleLevelComplete = useCallback((finalScore: number, finalShots: number) => {
    setScore(finalScore);
    setShots(finalShots);
    setCombo(null);

    setSaveData((prev) => {
      const already = prev.completed.includes(currentLevel);
      const newCompleted = already ? prev.completed : [...prev.completed, currentLevel];
      const prevBest = prev.bestScore[currentLevel] || 0;
      const newBest = Math.max(prevBest, finalScore);
      setIsNewHighScore(finalScore > prevBest);

      const updated: SaveData = {
        ...prev,
        completed: newCompleted,
        bestScore: {
          ...prev.bestScore,
          [currentLevel]: newBest,
        },
      };
      persistSave(updated);
      return updated;
    });

    setScreen('VICTORY');
  }, [currentLevel]);

  const handleGameOver = useCallback((finalScore: number, finalShots: number) => {
    setScore(finalScore);
    setShots(finalShots);
    setCombo(null);
    setScreen('GAME_OVER');
  }, []);

  const handlePause = useCallback(() => {
    if (screen === 'PLAYING') {
      setScreen('PAUSED');
    }
  }, [screen]);

  const handleResume = useCallback(() => {
    setScreen('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    handleStartLevel(currentLevel);
  }, [currentLevel, handleStartLevel]);

  const handleNextLevel = useCallback(() => {
    const nextIdx = Math.min(currentLevel + 1, TOTAL_LEVELS - 1);
    handleStartLevel(nextIdx);
  }, [currentLevel, handleStartLevel]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#05020f] select-none touch-none">
      {/* Splash Screen */}
      {screen === 'SPLASH' && (
        <Splash onDismiss={() => setScreen('MENU')} />
      )}

      {/* In-Game Persistent HUD */}
      {screen !== 'SPLASH' && screen !== 'MENU' && (
        <HUD
          levelIdx={currentLevel}
          score={score}
          shots={shots}
          combo={combo}
          soundEnabled={saveData.soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenMenu={() => setScreen('PAUSED')}
          onOpenHelp={() => setScreen('HOW_TO_PLAY')}
        />
      )}

      {/* 60fps Isolated Game Simulation Canvas */}
      <GameCanvas
        key={keyCounter}
        levelIdx={currentLevel}
        isPlaying={screen === 'PLAYING'}
        onScoreUpdate={handleScoreUpdate}
        onComboUpdate={setCombo}
        onLevelComplete={handleLevelComplete}
        onGameOver={handleGameOver}
        onPause={handlePause}
        onRestart={handleRestart}
      />

      {/* Modals & Overlays */}
      {screen === 'MENU' && (
        <TitleModal
          unlockedLevel={getNextUnlockedLevel()}
          completedCount={saveData.completed.length}
          soundEnabled={saveData.soundEnabled}
          onStart={handleStartLevel}
          onOpenLevelSelect={() => setScreen('LEVEL_SELECT')}
          onOpenHowToPlay={() => setScreen('HOW_TO_PLAY')}
          onToggleSound={handleToggleSound}
        />
      )}

      {screen === 'LEVEL_SELECT' && (
        <LevelSelectModal
          completedLevels={saveData.completed}
          bestScores={saveData.bestScore}
          initialLevel={currentLevel}
          onSelectLevel={handleStartLevel}
          onBack={() => setScreen('MENU')}
        />
      )}

      {screen === 'PAUSED' && (
        <PauseModal
          levelIdx={currentLevel}
          score={score}
          shots={shots}
          onResume={handleResume}
          onRestart={handleRestart}
          onLevelSelect={() => setScreen('LEVEL_SELECT')}
          onMainMenu={() => setScreen('MENU')}
        />
      )}

      {screen === 'VICTORY' && (
        <VictoryModal
          levelIdx={currentLevel}
          score={score}
          shots={shots}
          isNewHigh={isNewHighScore}
          onNextLevel={handleNextLevel}
          onReplay={handleRestart}
          onLevelSelect={() => setScreen('LEVEL_SELECT')}
          onMainMenu={() => setScreen('MENU')}
        />
      )}

      {screen === 'GAME_OVER' && (
        <GameOverModal
          levelIdx={currentLevel}
          score={score}
          shots={shots}
          onRetry={handleRestart}
          onLevelSelect={() => setScreen('LEVEL_SELECT')}
          onMainMenu={() => setScreen('MENU')}
        />
      )}

      {screen === 'HOW_TO_PLAY' && (
        <HowToPlayModal
          onBack={() => {
            // Return to previous screen or playing
            setScreen('MENU');
          }}
        />
      )}
    </main>
  );
}
