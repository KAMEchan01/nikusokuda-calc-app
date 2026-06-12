/**
 * GameScreen - Core gameplay
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop, GAME_STATUS } from '../../hooks/useGameLoop';
import { useSound } from '../../hooks/useSound';
import { getReduceMotion, getChallenge100 } from '../../utils/storage';
import { MeatCard } from '../ui/MeatCard';
import { Numpad } from '../ui/Numpad';
import { ComboDisplay } from '../ui/ComboDisplay';
import { GradeDisplay } from '../ui/GradeDisplay';
import { GRADES } from '../../utils/score';

export function GameScreen({ levelId, onGameEnd, onHome }) {
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
    abortGame,
  } = useGameLoop(levelId, { challenge100 });

  const { playCorrect, playWrong, playBurn, playCombo } = useSound();
  const prevGradeRef = useRef(null);
  const hasStarted = useRef(false);
  const [currentInput, setCurrentInput] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reduceMotion] = useState(() => getReduceMotion());
  const [challenge100] = useState(() => getChallenge100());

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

  const handleCancelPress = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    abortGame();
    onHome();
  }, [abortGame, onHome]);

  const handleCancelDecline = useCallback(() => {
    setShowCancelDialog(false);
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
      {!reduceMotion && (
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
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 z-10">
        {/* Cancel button */}
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/80 text-gray-400 active:scale-90 transition-all"
          onPointerDown={(e) => { e.preventDefault(); handleCancelPress(); }}
          aria-label="ゲームをやめる"
        >
          <span className="text-lg leading-none">✕</span>
        </button>

        <div className="flex flex-col items-center">
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
        {/* Challenge100 badge */}
        {challenge100 && (
          <div className="flex justify-center pb-1">
            <span className="text-xs font-black tracking-widest px-3 py-1 rounded-full"
              style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.4)' }}>
              ⏱ 100秒チャレンジ
            </span>
          </div>
        )}

        {/* Grade flash */}
        <div className="h-14 flex items-center justify-center">
          <GradeDisplay lastGrade={lastGrade} reduceMotion={reduceMotion} />
        </div>

        {/* Combo display */}
        <div className="h-12 flex items-center justify-center">
          <ComboDisplay comboDisplay={comboDisplay} combo={combo} reduceMotion={reduceMotion} />
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
                reduceMotion={reduceMotion}
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
          disabled={!isPlaying || showCancelDialog}
          resetKey={currentIdx}
        />
      </div>

      {/* Cancel confirmation dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-xs rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #2d1810, #1a1008)',
                border: '1.5px solid rgba(245,158,11,0.3)',
                boxShadow: '0 0 40px rgba(0,0,0,0.8)',
              }}
            >
              {/* Dialog header */}
              <div className="px-6 pt-6 pb-4 text-center">
                <span className="text-4xl">🍖</span>
                <h2 className="text-white font-black text-xl mt-2">ゲームをやめますか？</h2>
                <p className="text-gray-400 text-sm mt-1.5 leading-snug">
                  途中でやめると<br />
                  <span className="text-red-400 font-bold">記録は保存されません</span>
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-amber-900/40 mx-4" />

              {/* Buttons */}
              <div className="flex flex-col gap-3 px-5 py-5">
                <button
                  className="w-full py-4 rounded-xl text-base font-black text-white active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    boxShadow: '0 4px 16px rgba(220,38,38,0.4)',
                  }}
                  onPointerDown={(e) => { e.preventDefault(); handleCancelConfirm(); }}
                >
                  やめてホームへ戻る
                </button>
                <button
                  className="w-full py-4 rounded-xl text-base font-black active:scale-95 transition-all"
                  style={{
                    background: 'rgba(245,158,11,0.15)',
                    border: '1.5px solid rgba(245,158,11,0.5)',
                    color: '#f59e0b',
                  }}
                  onPointerDown={(e) => { e.preventDefault(); handleCancelDecline(); }}
                >
                  続ける
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GameScreen;
