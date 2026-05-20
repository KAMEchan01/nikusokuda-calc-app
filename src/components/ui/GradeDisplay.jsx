/**
 * GradeDisplay - Flash shows cooking grade after each answer
 */
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GRADE_CONFIG, GRADES } from '../../utils/score';

export function GradeDisplay({ lastGrade, reduceMotion = false }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [key, setKey] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lastGrade) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setCurrent(lastGrade);
    setVisible(true);
    setKey(k => k + 1);

    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastGrade]);

  if (!current) return null;

  const config = GRADE_CONFIG[current.grade] || GRADE_CONFIG[GRADES.WELL_DONE];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.3, y: reduceMotion ? 0 : -10 }}
          animate={{ opacity: 1, scale: reduceMotion ? 1 : 1.1, y: 0 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.8, y: reduceMotion ? 0 : -20 }}
          transition={reduceMotion
            ? { duration: 0.1 }
            : { enter: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }, exit: { duration: 0.3 } }
          }
          className="flex flex-col items-center pointer-events-none"
        >
          <div
            className="px-5 py-2 rounded-xl flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${config.color}20, ${config.color}10)`,
              border: `2px solid ${config.color}80`,
              boxShadow: `0 0 20px ${config.color}50`,
            }}
          >
            <span className="text-2xl">{config.emoji}</span>
            <span
              className="text-xl font-black tracking-wide"
              style={{
                color: config.color,
                textShadow: `0 0 10px ${config.color}`,
              }}
            >
              {config.label}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GradeDisplay;
