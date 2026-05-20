/**
 * LocalStorage helpers for Nikusokuda
 */

const PREFIX = 'nikusokuda_';

const KEYS = {
  bestTime: (level) => `${PREFIX}bestTime_${level}`,
  bestSales: (level) => `${PREFIX}bestSales_${level}`,
  totalSales: `${PREFIX}totalSales`,
  rank: `${PREFIX}rank`,
  zukan: `${PREFIX}zukan`,
  secretUnlocked: `${PREFIX}secretUnlocked`,
  soundOn: `${PREFIX}soundOn`,
  autoReset: `${PREFIX}autoReset`,
  reduceMotion: `${PREFIX}reduceMotion`,
};

const ALL_LEVEL_IDS = [1, 2, 3, 4, 5, 'secret'];

function get(key, defaultVal = null) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultVal;
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

// Best Time (only on perfect clear - all 20 correct)
export function getBestTime(level) {
  return get(KEYS.bestTime(level), null);
}

export function saveBestTime(level, timeMs) {
  const current = getBestTime(level);
  if (current === null || timeMs < current) {
    set(KEYS.bestTime(level), timeMs);
    return true;
  }
  return false;
}

// Best Sales (always)
export function getBestSales(level) {
  return get(KEYS.bestSales(level), 0);
}

export function saveBestSales(level, sales) {
  const current = getBestSales(level);
  if (sales > current) {
    set(KEYS.bestSales(level), sales);
    return true;
  }
  return false;
}

// Total cumulative sales
export function getTotalSales() {
  return get(KEYS.totalSales, 0);
}

export function addTotalSales(amount) {
  const current = getTotalSales();
  const next = current + amount;
  set(KEYS.totalSales, next);
  return next;
}

// Shop rank thresholds
export const RANK_THRESHOLDS = [
  { min: 0, name: "見習い店員", emoji: "🧑‍🍳", color: "#9ca3af" },
  { min: 3000, name: "焼肉職人", emoji: "👨‍🍳", color: "#22c55e" },
  { min: 5000, name: "肉の達人", emoji: "🥩", color: "#f59e0b" },
  { min: 10000, name: "肉速王", emoji: "🔥", color: "#f97316" },
  { min: 30000, name: "焼肉王", emoji: "👑", color: "#a855f7" },
  { min: 100000, name: "伝説の焼肉王", emoji: "⚡", color: "#dc2626" },
];

export function getRankFromSales(totalSales) {
  let current = RANK_THRESHOLDS[0];
  for (const threshold of RANK_THRESHOLDS) {
    if (totalSales >= threshold.min) {
      current = threshold;
    } else {
      break;
    }
  }
  return current;
}

export function getNextRank(totalSales) {
  for (const threshold of RANK_THRESHOLDS) {
    if (totalSales < threshold.min) {
      return threshold;
    }
  }
  return null; // Max rank
}

export function getCurrentRank() {
  const total = getTotalSales();
  return getRankFromSales(total);
}

// Zukan (meat encyclopedia)
export function getZukan() {
  return get(KEYS.zukan, []);
}

export function unlockMeats(meatNames) {
  const current = getZukan();
  const newOnes = meatNames.filter(n => !current.includes(n));
  if (newOnes.length > 0) {
    set(KEYS.zukan, [...current, ...newOnes]);
  }
  return newOnes;
}

export function isMeatUnlocked(meatName) {
  return getZukan().includes(meatName);
}

// Secret stage
export function isSecretUnlocked() {
  return get(KEYS.secretUnlocked, false);
}

export function unlockSecret() {
  set(KEYS.secretUnlocked, true);
}

// Settings
export function getSoundOn() {
  return get(KEYS.soundOn, true);
}

export function setSoundOn(val) {
  set(KEYS.soundOn, val);
}

export function getAutoReset() {
  return get(KEYS.autoReset, false);
}

export function setAutoReset(val) {
  set(KEYS.autoReset, val);
}

export function getReduceMotion() {
  return get(KEYS.reduceMotion, false);
}

export function setReduceMotion(val) {
  set(KEYS.reduceMotion, val);
}

// Data reset helpers
export function clearBestTimes() {
  ALL_LEVEL_IDS.forEach(level => {
    localStorage.removeItem(KEYS.bestTime(level));
  });
}

export function clearAllData() {
  Object.keys(localStorage)
    .filter(key => key.startsWith(PREFIX))
    .forEach(key => localStorage.removeItem(key));
}

export default {
  getBestTime, saveBestTime,
  getBestSales, saveBestSales,
  getTotalSales, addTotalSales,
  getCurrentRank, getRankFromSales, getNextRank, RANK_THRESHOLDS,
  getZukan, unlockMeats, isMeatUnlocked,
  isSecretUnlocked, unlockSecret,
  getSoundOn, setSoundOn,
  getAutoReset, setAutoReset,
};
