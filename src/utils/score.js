/**
 * Scoring system for Nikusokuda
 */

export const GRADES = {
  LEGEND_RARE: "LEGEND RARE",
  PERFECT_MEDIUM: "PERFECT MEDIUM",
  GOOD: "GOOD",
  WELL_DONE: "WELL DONE",
  BURNT: "BURNT",
};

export const GRADE_CONFIG = {
  [GRADES.LEGEND_RARE]: {
    emoji: "🔥",
    label: "LEGEND RARE!!",
    color: "#f59e0b",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-400/20",
    maxMs: 1000,
  },
  [GRADES.PERFECT_MEDIUM]: {
    emoji: "✨",
    label: "PERFECT MEDIUM!!",
    color: "#22c55e",
    textColor: "text-green-400",
    bgColor: "bg-green-400/20",
    maxMs: 2000,
  },
  [GRADES.GOOD]: {
    emoji: "👍",
    label: "GOOD!",
    color: "#60a5fa",
    textColor: "text-blue-400",
    bgColor: "bg-blue-400/20",
    maxMs: 3000,
  },
  [GRADES.WELL_DONE]: {
    emoji: "✅",
    label: "WELL DONE",
    color: "#ffffff",
    textColor: "text-white",
    bgColor: "bg-white/10",
    maxMs: 5000,
  },
  [GRADES.BURNT]: {
    emoji: "💀",
    label: "BURNT!!",
    color: "#6b7280",
    textColor: "text-gray-500",
    bgColor: "bg-gray-800/50",
    maxMs: Infinity,
  },
};

export function getGrade(timeMs) {
  if (timeMs <= 1000) return GRADES.LEGEND_RARE;
  if (timeMs <= 2000) return GRADES.PERFECT_MEDIUM;
  if (timeMs <= 3000) return GRADES.GOOD;
  if (timeMs <= 5000) return GRADES.WELL_DONE;
  return GRADES.BURNT;
}

/**
 * Calculate score for a single answer
 * @param {number} timeMs - time taken in milliseconds
 * @param {number} levelPrice - base price for this level
 * @param {number} combo - current combo count
 * @param {boolean} allCorrectUnder2s - all answers so far under 2s
 */
export function calcScore(timeMs, levelPrice, combo, allCorrectUnder2s = false) {
  if (timeMs > 5000) {
    return { earned: 0, speedBonus: 0, comboBonus: 0, grade: GRADES.BURNT };
  }

  const base = levelPrice;
  let speedBonus = 0;
  let comboBonus = 0;

  const grade = getGrade(timeMs);

  // Speed bonus: 20% if under 2 seconds
  if (timeMs <= 2000) {
    speedBonus = Math.floor(base * 0.2);
  }

  // Combo bonus
  if (combo >= 20 && allCorrectUnder2s) {
    comboBonus = base; // perfect
  } else if (combo >= 10) {
    comboBonus = Math.floor(base * 0.5);
  } else if (combo >= 6) {
    comboBonus = Math.floor(base * 0.3);
  } else if (combo >= 3) {
    comboBonus = Math.floor(base * 0.25);
  }

  return {
    earned: base + speedBonus + comboBonus,
    speedBonus,
    comboBonus,
    grade,
  };
}

/**
 * Get combo display info
 */
export function getComboDisplay(combo) {
  if (combo >= 10) {
    return {
      label: `🔥🔥🔥 LEGEND COMBO!! x${combo}`,
      intensity: 3,
      color: "#dc2626",
    };
  }
  if (combo >= 6) {
    return {
      label: `🔥🔥 DOUBLE MEAT COMBO!! x${combo}`,
      intensity: 2,
      color: "#f97316",
    };
  }
  if (combo >= 3) {
    return {
      label: `🔥 MEAT COMBO!! x${combo}`,
      intensity: 1,
      color: "#f59e0b",
    };
  }
  return null;
}

/**
 * Calculate accuracy rate
 */
export function calcAccuracy(correct, total) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Determine game result rank (A-F)
 */
export function calcResultRank(accuracy, totalSales, perfectSales) {
  const ratio = totalSales / perfectSales;
  if (accuracy === 100 && ratio >= 1.2) return "S";
  if (accuracy === 100 && ratio >= 1.0) return "A";
  if (accuracy >= 90 && ratio >= 0.8) return "B";
  if (accuracy >= 70 && ratio >= 0.6) return "C";
  if (accuracy >= 50) return "D";
  return "F";
}

export default { calcScore, getGrade, getComboDisplay, calcAccuracy, calcResultRank };
