/**
 * ResultScreen - Shows game results, stats, rank
 */
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../../hooks/useSound';
import { RankBadge } from '../ui/RankBadge';
import { GRADE_CONFIG } from '../../utils/score';
import {
  getTotalSales, getRankFromSales, getNextRank,
  getBestTime, getBestSales, RANK_THRESHOLDS,
} from '../../utils/storage';
import LEVELS from '../../data/levels';

function formatTime(ms) {
  if (!ms && ms !== 0) return '--';
  const s = Math.floor(ms / 1000);
  const dec = Math.floor((ms % 1000) / 100);
  return `${s}.${dec}s`;
}

function ResultGrade({ rank }) {
  const colors = {
    S: '#f59e0b',
    A: '#22c55e',
    B: '#60a5fa',
    C: '#a855f7',
    D: '#6b7280',
    F: '#374151',
  };
  const color = colors[rank] || '#9ca3af';
  return (
    <div
      className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl font-black"
      style={{
        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        border: `3px solid ${color}`,
        boxShadow: `0 0 25px ${color}60`,
        color,
        textShadow: `0 0 15px ${color}`,
      }}
    >
      {rank}
    </div>
  );
}

export function ResultScreen({ gameResult, levelId, onHome, onRetry }) {
  const [showDetails, setShowDetails] = useState(false);
  const [rankUpAnim, setRankUpAnim] = useState(false);
  const { playRankUp, playSelect } = useSound();

  const level = LEVELS[levelId];
  const totalSales = getTotalSales();
  const currentRank = getRankFromSales(totalSales);
  const nextRank = getNextRank(totalSales);
  const bestTime = getBestTime(levelId);
  const bestSales = getBestSales(levelId);

  const {
    correct = 0,
    accuracy = 0,
    finalSales = 0,
    totalElapsed = 0,
    isPerfect = false,
    answers = [],
    secretUnlocked = false,
    rankUp = null,
    nextLevelJustUnlocked = false,
    nextLevelId = null,
  } = gameResult || {};

  // Determine result rank
  const ratio = level ? finalSales / level.perfectSales : 0;
  let resultGrade = 'F';
  if (accuracy === 100 && ratio >= 1.2) resultGrade = 'S';
  else if (accuracy === 100 && ratio >= 1.0) resultGrade = 'A';
  else if (accuracy >= 90 && ratio >= 0.8) resultGrade = 'B';
  else if (accuracy >= 70 && ratio >= 0.6) resultGrade = 'C';
  else if (accuracy >= 50) resultGrade = 'D';

  useEffect(() => {
    const t = setTimeout(() => setShowDetails(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (rankUp) {
      const t = setTimeout(() => {
        setRankUpAnim(true);
        playRankUp();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [rankUp, playRankUp]);

  // Best grade across answers
  const gradeCounts = {};
  answers.forEach(a => {
    if (a.correct) {
      gradeCounts[a.grade] = (gradeCounts[a.grade] || 0) + 1;
    }
  });

  const handleHome = useCallback(() => {
    playSelect();
    onHome();
  }, [playSelect, onHome]);

  const handleRetry = useCallback(() => {
    playSelect();
    onRetry();
  }, [playSelect, onRetry]);

  // Newly unlocked meats from this game
  const levelMeats = level?.meats || [];

  return (
    <div
      className="flex flex-col h-full w-full overflow-y-auto no-scrollbar"
      style={{ background: 'linear-gradient(180deg, #1a1008 0%, #0d0804 100%)' }}
    >
      <div className="flex flex-col items-center px-4 pt-4 pb-6 gap-4 min-h-full">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {secretUnlocked ? (
            <div className="flex flex-col items-center gap-1">
              <p className="text-yellow-400 text-3xl font-black animate-title-glow">
                ⚡ SECRET STAGE UNLOCKED!! ⚡
              </p>
              <p className="text-white text-sm">伝説の焼肉師の証明！</p>
            </div>
          ) : isPerfect ? (
            <div className="flex flex-col items-center gap-1">
              <p className="text-amber-400 text-2xl font-black">🎉 パーフェクト！！</p>
              {levelId === 'secret' && (
                <p className="text-yellow-300 text-xl font-black">
                  MASTER CLEAR!! YOU ARE A MEAT MASTER
                </p>
              )}
            </div>
          ) : (
            <p className="text-white text-xl font-black">
              {accuracy >= 70 ? '👍 よくできました！' : accuracy >= 50 ? 'もう少し！' : '😅 また挑戦！'}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">{level?.name}</p>
        </motion.div>

        {/* Next level unlock notification */}
        <AnimatePresence>
          {nextLevelJustUnlocked && nextLevelId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-full flex flex-col items-center gap-1 py-3 px-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                border: '2px solid rgba(34,197,94,0.4)',
                boxShadow: '0 0 20px rgba(34,197,94,0.2)',
              }}
            >
              <p className="text-green-400 font-black text-sm tracking-wider">🔓 STAGE UNLOCKED!!</p>
              <p className="text-white text-xs">LEVEL {nextLevelId} が解放されました！</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Grade + Sales */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex items-center gap-4 w-full justify-center"
            >
              <ResultGrade rank={resultGrade} />
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">今回の売上</span>
                <span className="text-white text-4xl font-black">
                  ¥{finalSales.toLocaleString()}
                </span>
                {finalSales > bestSales - finalSales && bestSales === finalSales && (
                  <span className="text-amber-400 text-xs font-bold">🏆 NEW RECORD!</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats grid */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full grid grid-cols-2 gap-2"
            >
              <StatCard label="正解率" value={`${accuracy}%`} sub={`${correct}/${answers.length}問`} />
              <StatCard label="タイム" value={formatTime(totalElapsed)} sub={isPerfect ? '★ベスト登録' : ''} />
              <StatCard label="最高コンボ" value={`x${Math.max(...answers.map((_, i) => {
                let c = 0;
                for (let j = 0; j <= i; j++) if (answers[j]?.correct) c++; else c = 0;
                return c;
              }), 0)}`} sub="連続正解" />
              <StatCard
                label="ベスト売上"
                value={`¥${bestSales.toLocaleString()}`}
                sub="このステージ"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rank Up animation */}
        <AnimatePresence>
          {rankUpAnim && rankUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-full flex flex-col items-center gap-2 py-3 px-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${rankUp.color}20, ${rankUp.color}10)`,
                border: `2px solid ${rankUp.color}60`,
                boxShadow: `0 0 30px ${rankUp.color}40`,
              }}
            >
              <p className="text-white font-black text-sm tracking-wider">⬆ RANK UP!!</p>
              <RankBadge rank={rankUp} size="lg" animate />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total sales & rank */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-black/40 border border-gray-800"
            >
              <div className="flex justify-between w-full items-center">
                <span className="text-gray-400 text-xs">累計売上</span>
                <span className="text-amber-400 font-black">¥{totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-full items-center">
                <span className="text-gray-400 text-xs">現在のランク</span>
                <RankBadge rank={currentRank} size="sm" />
              </div>
              {nextRank && (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>次のランクまで</span>
                    <span>¥{(nextRank.min - totalSales).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, ((totalSales - currentRank.min) / (nextRank.min - currentRank.min)) * 100)}%`,
                        backgroundColor: nextRank.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer breakdown (collapsible) */}
        <AnimatePresence>
          {showDetails && answers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full"
            >
              <div className="flex flex-wrap gap-1 justify-center">
                {answers.map((a, i) => {
                  const cfg = GRADE_CONFIG[a.grade];
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center w-8"
                      title={`Q${i + 1}: ${a.correct ? '正解' : '不正解'}`}
                    >
                      <span className="text-xs">{a.correct ? cfg?.emoji || '✅' : '❌'}</span>
                      <span className="text-gray-600" style={{ fontSize: '8px' }}>
                        {a.correct ? `${(a.timeMs / 1000).toFixed(1)}s` : 'X'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full mt-auto pt-2">
          <button
            className="w-full py-4 rounded-xl text-xl font-black text-white bg-red-700 hover:bg-red-600 active:bg-red-800 active:scale-95 transition-all shadow-lg shadow-red-900/50"
            onPointerDown={(e) => { e.preventDefault(); handleRetry(); }}
          >
            🔄 もう一度！
          </button>
          <button
            className="w-full py-3.5 rounded-xl text-lg font-bold text-amber-400 bg-amber-900/30 border border-amber-700/50 hover:bg-amber-900/50 active:scale-95 transition-all"
            onPointerDown={(e) => { e.preventDefault(); handleHome(); }}
          >
            🏠 ホームへ
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-black/40 border border-gray-800 rounded-xl py-3 px-2">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-white text-2xl font-black leading-none">{value}</span>
      {sub && <span className="text-amber-500/70 text-xs">{sub}</span>}
    </div>
  );
}

export default ResultScreen;
