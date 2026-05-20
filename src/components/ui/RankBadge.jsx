/**
 * RankBadge - Shows current shop rank with styling
 */
import { motion } from 'framer-motion';

export function RankBadge({ rank, animate = false, size = 'md' }) {
  if (!rank) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const content = (
    <div
      className={`inline-flex items-center rounded-full font-bold ${sizeClasses[size]}`}
      style={{
        background: `linear-gradient(135deg, ${rank.color}30, ${rank.color}15)`,
        border: `1px solid ${rank.color}60`,
        color: rank.color,
        boxShadow: `0 0 10px ${rank.color}30`,
      }}
    >
      <span>{rank.emoji}</span>
      <span>{rank.name}</span>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

export default RankBadge;
