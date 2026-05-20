/**
 * MeatCard - Shows current question with meat theme
 * Timer bar depletes over 5 seconds with color change
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MEATS from '../../data/meats';

const TIMER_COLORS = [
  { threshold: 0.6, color: '#22c55e' },  // green > 60%
  { threshold: 0.35, color: '#eab308' }, // yellow > 35%
  { threshold: 0.15, color: '#f97316' }, // orange > 15%
  { threshold: 0, color: '#dc2626' },    // red
];

function getTimerColor(ratio) {
  for (const { threshold, color } of TIMER_COLORS) {
    if (ratio > threshold) return color;
  }
  return '#dc2626';
}

function getBorderGlow(ratio) {
  if (ratio > 0.6) return '0 0 0 2px #22c55e, 0 0 20px rgba(34,197,94,0.3)';
  if (ratio > 0.35) return '0 0 0 2px #eab308, 0 0 20px rgba(234,179,8,0.4)';
  if (ratio > 0.15) return '0 0 0 2px #f97316, 0 0 25px rgba(249,115,22,0.5)';
  return '0 0 0 2px #dc2626, 0 0 30px rgba(220,38,38,0.7)';
}

export function MeatCard({ question, timeRatio, questionIdx, levelMeats, currentInput = '', reduceMotion = false }) {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (timeRatio <= 0.15 && timeRatio > 0) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 400);
      return () => clearTimeout(t);
    }
  }, [Math.floor(timeRatio * 10)]);

  // Pick a meat for display from the level's meats list
  const meatName = levelMeats[questionIdx % levelMeats.length];
  const meat = MEATS[meatName] || { emoji: '🥩', description: '' };

  const timerColor = getTimerColor(timeRatio);
  const borderGlow = getBorderGlow(timeRatio);
  const timerWidth = `${Math.max(0, timeRatio * 100)}%`;

  if (!question) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIdx}
        initial={{ x: reduceMotion ? 0 : 80, opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: reduceMotion ? 0 : -80, opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        transition={{ duration: reduceMotion ? 0.1 : 0.2, ease: 'easeOut' }}
        className={`relative w-full rounded-2xl overflow-hidden ${shaking ? 'animate-shake' : ''}`}
        style={{ boxShadow: borderGlow }}
      >
        {/* Card background - grill texture */}
        <div
          className="grill-texture absolute inset-0 opacity-20"
          style={{ background: 'linear-gradient(135deg, #2d1810 0%, #1a1008 50%, #2d1810 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(45,24,16,0.95) 0%, rgba(26,16,8,0.98) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-5 gap-2">
          {/* Meat emoji + name */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))' }}>
              {meat.emoji}
            </span>
            <span className="text-amber-400 text-sm font-bold tracking-wider opacity-90">
              {meatName}
            </span>
          </div>

          {/* Formula - the star of the show */}
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="text-white text-5xl font-black tracking-tight drop-shadow-lg">
              {question.a}
            </span>
            <span className="text-amber-400 text-4xl font-black">
              {question.op}
            </span>
            <span className="text-white text-5xl font-black tracking-tight drop-shadow-lg">
              {question.b}
            </span>
            <span className="text-gray-400 text-4xl font-black">=</span>
            <span
              className="text-5xl font-black min-w-[2.5ch] text-center"
              style={{
                color: currentInput ? '#ffffff' : '#f59e0b',
                opacity: currentInput ? 1 : 0.7,
                textShadow: currentInput ? '0 0 20px rgba(255,255,255,0.6)' : '0 0 12px rgba(245,158,11,0.5)',
              }}
            >
              {currentInput || '?'}
            </span>
          </div>
        </div>

        {/* Timer bar at bottom */}
        <div className="relative h-2 bg-gray-900 rounded-b-2xl overflow-hidden">
          <div
            className="h-full transition-all duration-100 ease-linear rounded-b-2xl"
            style={{
              width: timerWidth,
              backgroundColor: timerColor,
              boxShadow: `0 0 8px ${timerColor}`,
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MeatCard;
