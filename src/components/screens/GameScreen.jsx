/**
 * GameScreen - Core gameplay
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop, GAME_STATUS } from '../../hooks/useGameLoop';
import { useSound } from '../../hooks/useSound';
import { MeatCard } from '../ui/MeatCard';
import { Numpad } from '../ui/Numpad';
import { ComboDisplay } from '../ui/ComboDisplay';
import { GradeDisplay } from '../ui/GradeDisplay';
import { GRADES } from '../../utils/score';

export function GameScreen({ levelId, onGameEnd }) {
  const {
    status,
    currentQuestion,
    currentIdx,
    totalQuestions,
    answers,
    totalSales,
    combo,
    comboDisplay,
    lastGrade,
    timeRatio,
    gameResult,
    level,
    startGame,
    submitAnswer,
  } = useGameLoop(levelId);

  const { playCorrect, playWrong, playBurn, playCombo } = useSound();
  const prevGradeRef = useRef(null);
  const hasStarted = useRef(false);
  const [currentInput, setCurrentInput] = useState('');

  // Start game on mount
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startGame();
    }
  }, [startGame]);

  // Play sounds based on grade
  useEffect(() => {
    if (!lastGrade || lastGrade === prevGradeRef.current) return;
    prevGradeRef.current = lastGrade;

    if (lastGrade.grade === GRADES.BURNT) {
      playBurn();
    } else if (lastGrade.isCorrect) {
      playCorrect();
      if (combo >= 3) {
        const intensity = combo >= 10 ? 3 : combo >= 6 ? 2 : 1;
        playCombo(intensity);
      }
    } else {
      playWrong();
    }
  }, [lastGrade, combo, playCorrect, playWrong, playBurn, playCombo]);

  // Navigate to result when game over
  useEffect(() => {
    if (status === GAME_STATUS.GAME_OVER && gameResult) {
      const t = setTimeout(() => {
        onGameEnd(gameResult);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [status, gameResult, onGameEnd]);

  const handleSubmit = useCallback((input) => {
    submitAnswer(input);
    setCurrentInput('');
  }, [submitAnswer]);

  const handleInputChange = useCallback((val) => {
    setCurrentInput(val);
  }, []);

  const levelColor = level?.color || '#f97316';
  const isPlaying = status === GAME_STATUS.PLAYING;
  const platesLeft = totalQuestions - answers.length;

  // Combo fire background
  const fireIntensity = combo >= 10 ? 0.3 : combo >= 6 ? 0.2 : combo >= 3 ? 0.1 : 0;

  return (
    <div
      className="flex flex-col h-full w-full relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1a1008 0%, #0d0804 100%)' }}
    >
      {/* Fire glow background for combos */}
      <AnimatePresence>
        {fireIntensity > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: fireIntensity }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.5) 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 z-10">
        <div className="flex flex-col">
          <span className="text-xs text-amber-500/70 font-bold tracking-wider uppercase">
            {level?.name}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-amber-400 text-xs">売上</span>
            <span className="text-white font-black text-lg leading-none">
              ¥{totalSales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Plates counter */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 font-bold">残り皿</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, platesLeft) }).map((_, i) => (
              <span key={i} className="text-sm">🍽️</span>
            ))}
            {platesLeft > 5 && (
              <span className="text-amber-400 text-xs font-bold">+{platesLeft - 5}</span>
            )}
          </div>
        </div>
      </div>

      {/* Question progress dots */}
      <div className="flex items-center gap-1 px-4 pb-1 flex-wrap z-10">
        {Array.from({ length: totalQuestions }).map((_, i) => {
          const ans = answers[i];
          const isCurrent = i === currentIdx;
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${
                ans
                  ? ans.correct
                    ? 'w-2.5 h-2.5 bg-green-500'
                    : 'w-2.5 h-2.5 bg-red-600'
                  : isCurrent
                  ? 'w-3 h-3 bg-amber-400 animate-pulse'
                  : 'w-2 h-2 bg-gray-700'
              }`}
            />
          );
        })}
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col px-3 gap-2 min-h-0 z-10">
        {/* Grade flash */}
        <div className="h-14 flex items-center justify-center">
          <GradeDisplay lastGrade={lastGrade} />
        </div>

        {/* Combo display */}
        <div className="h-12 flex items-center justify-center">
          <ComboDisplay comboDisplay={comboDisplay} combo={combo} />
        </div>

        {/* Meat card */}
        <div className="flex-1 min-h-0 flex items-center">
          {currentQuestion && isPlaying && (
            <div className="w-full">
              <MeatCard
                question={currentQuestion}
                timeRatio={timeRatio}
                questionIdx={currentIdx}
                levelMeats={level?.meats || ['牛タン']}
                currentInput={currentInput}
              />
            </div>
          )}
        </div>
      </div>

      {/* Numpad area */}
      <div className="z-10 px-3 pb-3">
        <Numpad
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          disabled={!isPlaying}
          resetKey={currentIdx}
        />
      </div>
    </div>
  );
}

export default GameScreen;
