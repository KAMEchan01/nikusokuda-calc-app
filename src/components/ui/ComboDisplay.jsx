/**
 * ComboDisplay - Shows combo streak with fire effects
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function ComboDisplay({ comboDisplay, combo, reduceMotion = false }) {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (comboDisplay && combo >= 3) {
      setVisible(true);
      setKey(k => k + 1);
      const t = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [combo]);

  if (!comboDisplay) return null;

  const intensity = comboDisplay.intensity;
  const glowColor = intensity >= 3 ? '#dc2626' : intensity >= 2 ? '#f97316' : '#f59e0b';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.4, y: reduceMotion ? 0 : -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.7, y: reduceMotion ? 0 : -10 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center pointer-events-none"
        >
          {/* Fire particles */}
          {!reduceMotion && <FireParticles intensity={intensity} />}

          {/* Label */}
          <div
            className="px-4 py-2 rounded-xl text-center"
            style={{
              background: `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))`,
              boxShadow: `0 0 20px ${glowColor}60, 0 0 40px ${glowColor}30`,
              border: `1px solid ${glowColor}60`,
            }}
          >
            <p
              className="text-base font-black tracking-wide"
              style={{
                color: glowColor,
                textShadow: `0 0 10px ${glowColor}`,
              }}
            >
              {comboDisplay.label}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FireParticles({ intensity }) {
  const count = intensity >= 3 ? 8 : intensity >= 2 ? 5 : 3;

  return (
    <div className="relative h-8 w-full flex justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-base"
          style={{ left: `${10 + i * (80 / (count - 1 || 1))}%` }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: -30,
            opacity: 0,
            scale: 0.5,
            x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 10 + 5),
          }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            delay: Math.random() * 0.2,
            ease: 'easeOut',
          }}
        >
          🔥
        </motion.span>
      ))}
    </div>
  );
}

export default ComboDisplay;
