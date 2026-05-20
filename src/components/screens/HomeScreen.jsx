/**
 * HomeScreen - Title, level select, stats, settings
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../../hooks/useSound';
import { RankBadge } from '../ui/RankBadge';
import {
  getTotalSales, getRankFromSales, getNextRank,
  getBestTime, getBestSales, isSecretUnlocked,
  getSoundOn, setSoundOn, getAutoReset, setAutoReset,
} from '../../utils/storage';
import LEVELS, { LEVEL_ORDER } from '../../data/levels';

function formatTime(ms) {
  if (!ms && ms !== 0) return '--';
  const s = Math.floor(ms / 1000);
  const dec = Math.floor((ms % 1000) / 100);
  return `${s}.${dec}s`;
}

export function HomeScreen({ onStartGame, onZukan }) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundLocal] = useState(getSoundOn);
  const [autoReset, setAutoResetLocal] = useState(getAutoReset);
  const { playSelect } = useSound();

  const secretUnlocked = isSecretUnlocked();
  const totalSales = getTotalSales();
  const currentRank = getRankFromSales(totalSales);
  const nextRank = getNextRank(totalSales);

  const handleLevelSelect = useCallback((id) => {
    playSelect();
    setSelectedLevel(id);
  }, [playSelect]);

  const handleStart = useCallback(() => {
    playSelect();
    onStartGame(selectedLevel);
  }, [selectedLevel, onStartGame, playSelect]);

  const handleSoundToggle = useCallback(() => {
    const next = !soundOn;
    setSoundLocal(next);
    setSoundOn(next);
  }, [soundOn]);

  const handleAutoResetToggle = useCallback(() => {
    const next = !autoReset;
    setAutoResetLocal(next);
    setAutoReset(next);
  }, [autoReset]);

  const level = LEVELS[selectedLevel];
  const bestTime = getBestTime(selectedLevel);
  const bestSales = getBestSales(selectedLevel);

  const displayLevels = [
    ...LEVEL_ORDER.map(id => LEVELS[id]),
    ...(secretUnlocked ? [LEVELS.secret] : []),
  ];

  return (
    <div
      className="flex flex-col h-full w-full overflow-y-auto no-scrollbar"
      style={{ background: 'linear-gradient(180deg, #1a1008 0%, #0d0804 100%)' }}
    >
      <div className="flex flex-col px-4 pt-4 pb-6 gap-4">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1
            className="text-5xl font-black tracking-tight animate-title-glow"
            style={{ color: '#f59e0b', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
          >
            肉速打
          </h1>
          <p className="text-red-500 font-black text-lg tracking-[0.3em] -mt-1">
            NIKUSOKUDA
          </p>
          <p className="text-gray-500 text-xs mt-1">京都高級焼肉店 × ゲームセンター</p>
        </motion.div>

        {/* Rank display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-1.5"
        >
          <RankBadge rank={currentRank} size="md" />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>累計売上</span>
            <span className="text-amber-500 font-bold">¥{totalSales.toLocaleString()}</span>
          </div>
          {nextRank && (
            <div className="w-48">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>→ {nextRank.emoji}{nextRank.name}</span>
                <span>¥{(nextRank.min - totalSales).toLocaleString()}</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((totalSales - currentRank.min) / (nextRank.min - currentRank.min)) * 100)}%`,
                    backgroundColor: nextRank.color,
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Level selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-2"
        >
          <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">ステージ選択</p>
          <div className="flex flex-col gap-2">
            {displayLevels.map((lv) => {
              const isSelected = selectedLevel === lv.id;
              const lBestSales = getBestSales(lv.id);
              const isSecret = lv.id === 'secret';

              return (
                <motion.button
                  key={lv.id}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                    isSelected
                      ? 'border-2 bg-black/60'
                      : 'border border-gray-800 bg-black/30'
                  }`}
                  style={isSelected ? {
                    borderColor: lv.color,
                    boxShadow: `0 0 15px ${lv.color}30`,
                  } : {}}
                  onPointerDown={(e) => { e.preventDefault(); handleLevelSelect(lv.id); }}
                >
                  <span className="text-3xl">{lv.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!isSecret && (
                        <span className="text-xs text-gray-600 font-bold">Lv.{lv.id}</span>
                      )}
                      {isSecret && (
                        <span className="text-xs text-purple-500 font-bold animate-pulse">SECRET</span>
                      )}
                      <span
                        className="font-black text-sm truncate"
                        style={{ color: isSelected ? lv.color : '#d1d5db' }}
                      >
                        {lv.name}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs truncate">{lv.subtitle}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-amber-500 text-xs font-bold">
                      ¥{lBestSales.toLocaleString()}
                    </span>
                    <span className="text-gray-600 text-xs">{lv.price}pt/問</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Selected level preview */}
        {level && (
          <motion.div
            key={selectedLevel}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 border border-gray-800"
          >
            <div className="flex flex-col flex-1 gap-1">
              <div className="flex gap-3 text-xs">
                <span className="text-gray-500">ベストタイム</span>
                <span className="text-white font-bold">{formatTime(bestTime)}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-gray-500">ベスト売上</span>
                <span className="text-amber-400 font-bold">¥{bestSales.toLocaleString()}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-gray-500">目標売上</span>
                <span className="text-white">¥{level.perfectSales?.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl">{level.emoji}</span>
              <span className="text-xs text-gray-600 mt-1">{level.meats?.join('・')}</span>
            </div>
          </motion.div>
        )}

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl text-2xl font-black text-white transition-all"
          style={{
            background: level
              ? `linear-gradient(135deg, ${level.color}, ${level.color}cc)`
              : '#dc2626',
            boxShadow: `0 4px 20px ${level?.color || '#dc2626'}50`,
          }}
          onPointerDown={(e) => { e.preventDefault(); handleStart(); }}
        >
          🔥 開始！
        </motion.button>

        {/* Bottom buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 py-3 rounded-xl text-sm font-bold text-amber-400 bg-amber-900/20 border border-amber-800/40 active:scale-95 transition-all"
            onPointerDown={(e) => { e.preventDefault(); playSelect(); onZukan(); }}
          >
            📖 肉図鑑
          </button>
          <button
            className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-400 bg-gray-900/40 border border-gray-800 active:scale-95 transition-all"
            onPointerDown={(e) => { e.preventDefault(); playSelect(); setShowSettings(s => !s); }}
          >
            ⚙️ 設定
          </button>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 px-4 py-3 rounded-xl bg-black/50 border border-gray-800">
                <p className="text-gray-400 text-xs font-bold tracking-wider uppercase">設定</p>

                <ToggleRow
                  label="サウンド"
                  value={soundOn}
                  onToggle={handleSoundToggle}
                  description={soundOn ? '🔊 ON' : '🔇 OFF'}
                />

                <ToggleRow
                  label="オートリセット"
                  value={autoReset}
                  onToggle={handleAutoResetToggle}
                  description={autoReset ? '⚡ ON (1ミス即終了)' : '🛡️ OFF'}
                />

                <div className="text-center">
                  <p className="text-gray-600 text-xs">肉速打 ver 1.0</p>
                  <p className="text-gray-700 text-xs">京都高級焼肉 × ゲームセンター</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onToggle, description }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-bold">{label}</p>
        <p className="text-gray-500 text-xs">{description}</p>
      </div>
      <button
        className={`w-12 h-6 rounded-full transition-all duration-200 relative ${
          value ? 'bg-amber-500' : 'bg-gray-700'
        }`}
        onPointerDown={(e) => { e.preventDefault(); onToggle(); }}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
            value ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export default HomeScreen;
