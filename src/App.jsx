/**
 * App.jsx - Main router for Nikusokuda
 * Screens: home → game → result → (zukan overlay)
 */
import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeScreen } from './components/screens/HomeScreen';
import { GameScreen } from './components/screens/GameScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { Zukan } from './components/Zukan';

const SCREENS = {
  HOME: 'home',
  GAME: 'game',
  RESULT: 'result',
};

// Screen transition animations
const screenVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [gameResult, setGameResult] = useState(null);
  const [showZukan, setShowZukan] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Force remount on retry

  const handleStartGame = useCallback((levelId) => {
    setSelectedLevel(levelId);
    setGameResult(null);
    setGameKey(k => k + 1);
    setScreen(SCREENS.GAME);
  }, []);

  const handleGameEnd = useCallback((result) => {
    setGameResult(result);
    setScreen(SCREENS.RESULT);
  }, []);

  const handleHome = useCallback(() => {
    setScreen(SCREENS.HOME);
    setGameResult(null);
  }, []);

  const handleRetry = useCallback(() => {
    setGameResult(null);
    setGameKey(k => k + 1);
    setScreen(SCREENS.GAME);
  }, []);

  const handleZukan = useCallback(() => {
    setShowZukan(true);
  }, []);

  const handleZukanClose = useCallback(() => {
    setShowZukan(false);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Screen routing */}
      <AnimatePresence mode="wait">
        {screen === SCREENS.HOME && (
          <motion.div
            key="home"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <HomeScreen
              onStartGame={handleStartGame}
              onZukan={handleZukan}
            />
          </motion.div>
        )}

        {screen === SCREENS.GAME && (
          <motion.div
            key={`game-${gameKey}`}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <GameScreen
              levelId={selectedLevel}
              onGameEnd={handleGameEnd}
              onHome={handleHome}
            />
          </motion.div>
        )}

        {screen === SCREENS.RESULT && (
          <motion.div
            key="result"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <ResultScreen
              gameResult={gameResult}
              levelId={selectedLevel}
              onHome={handleHome}
              onRetry={handleRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zukan overlay */}
      <AnimatePresence>
        {showZukan && (
          <Zukan onClose={handleZukanClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
