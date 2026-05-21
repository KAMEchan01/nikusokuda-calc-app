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
  getReduceMotion, setReduceMotion,
  clearBestTimes, clearAllData,
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
  const [reduceMotion, setReduceMotionLocal] = useState(getReduceMotion);
  const [confirmTarget, setConfirmTarget] = useState(null); // 'bestTime' | 'allData' | null
  const [dataVersion, setDataVersion] = useState(0); // force re-read after reset
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

  const handleReduceMotionToggle = useCallback(() => {
    const next = !reduceMotion;
    setReduceMotionLocal(next);
    setReduceMotion(next);
  }, [reduceMotion]);

  const handleClearBestTimes = useCallback(() => {
    clearBestTimes();
    setConfirmTarget(null);
    setDataVersion(v => v + 1);
  }, []);

  const handleClearAllData = useCallback(() => {
    clearAllData();
    setConfirmTarget(null);
    setDataVersion(v => v + 1);
    setSoundLocal(true);
    setAutoResetLocal(false);
    setReduceMotionLocal(false);
  }, []);

  const level = LEVELS[selectedLevel];
  const bestTime = getBestTime(selectedLevel);
  const bestSales = getBestSales(selectedLevel);

  const displayLevels = [
    ...LEVEL_ORDER.map(id => LEVELS[id]),
    ...(secretUnlocked ? [LEVELS.secret] : []),
  ];

  return (
    <>
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

      </div>
    </div>

    {/* Settings Modal - Bottom Sheet */}
    <AnimatePresence>
      {showSettings && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }}
            onPointerDown={() => { setShowSettings(false); setConfirmTarget(null); }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto rounded-t-3xl overflow-hidden"
            style={{
              maxWidth: 480,
              background: 'linear-gradient(180deg, #2d1810 0%, #1a1008 100%)',
              borderTop: '1px solid rgba(245,158,11,0.2)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-white font-black text-lg">⚙️ 設定</h2>
              <button
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                onPointerDown={(e) => { e.preventDefault(); setShowSettings(false); setConfirmTarget(null); }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="px-5 pb-10 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: '70vh' }}>

              {/* ゲーム設定 */}
              <div className="flex flex-col">
                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-2">ゲーム設定</p>
                <div className="flex flex-col rounded-xl overflow-hidden border border-gray-800">
                  <ToggleRow
                    label="効果音"
                    value={soundOn}
                    onToggle={handleSoundToggle}
                    description={soundOn ? '🔊 ON' : '🔇 OFF'}
                    bordered
                  />
                  <ToggleRow
                    label="オートリセット"
                    value={autoReset}
                    onToggle={handleAutoResetToggle}
                    description={autoReset ? '⚡ ON（1ミス即終了）' : '🛡️ OFF'}
                    bordered
                  />
                  <ToggleRow
                    label="アニメーション省略"
                    value={reduceMotion}
                    onToggle={handleReduceMotionToggle}
                    description={reduceMotion ? '⚡ 軽量モード' : '✨ フルエフェクト'}
                  />
                </div>
              </div>

              {/* データ管理 */}
              <div className="flex flex-col">
                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-2">データ管理</p>
                <div className="flex flex-col rounded-xl overflow-hidden border border-gray-800">
                  {confirmTarget === 'bestTime' ? (
                    <ConfirmRow
                      message="全レベルのベストタイムを削除しますか？"
                      onConfirm={handleClearBestTimes}
                      onCancel={() => setConfirmTarget(null)}
                    />
                  ) : (
                    <ActionRow
                      label="ベストタイムをリセット"
                      description="全レベルのベストタイムを削除"
                      color="#f59e0b"
                      onClick={() => setConfirmTarget('bestTime')}
                      bordered
                    />
                  )}
                  {confirmTarget === 'allData' ? (
                    <ConfirmRow
                      message="ランク・図鑑・記録をすべて削除します。この操作は元に戻せません。"
                      onConfirm={handleClearAllData}
                      onCancel={() => setConfirmTarget(null)}
                      danger
                    />
                  ) : (
                    <ActionRow
                      label="全データを削除"
                      description="ランク・図鑑・すべての記録をリセット"
                      color="#ef4444"
                      onClick={() => setConfirmTarget('allData')}
                    />
                  )}
                </div>
              </div>

              <p className="text-center text-gray-700 text-xs pb-2">肉速打 ver 1.0　京都高級焼肉 × ゲームセンター</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
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

function ActionRow({ label, description, color, onClick }) {
  return (
    <button
      className="w-full flex items-center justify-between py-2 active:opacity-70 transition-opacity"
      onPointerDown={(e) => { e.preventDefault(); onClick(); }}
    >
      <div className="text-left">
        <p className="text-sm font-bold" style={{ color }}>{label}</p>
        <p className="text-gray-600 text-xs">{description}</p>
      </div>
      <span className="text-gray-600 text-lg">›</span>
    </button>
  );
}

function ConfirmRow({ message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="flex flex-col gap-2 py-1 px-3 rounded-lg bg-gray-900/60 border border-gray-700">
      <p className="text-xs text-gray-300 leading-snug pt-1">{message}</p>
      <div className="flex gap-2 pb-1">
        <button
          className="flex-1 py-2 rounded-lg text-xs font-black active:scale-95 transition-all"
          style={{
            background: danger ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
            border: `1px solid ${danger ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.5)'}`,
            color: danger ? '#ef4444' : '#f59e0b',
          }}
          onPointerDown={(e) => { e.preventDefault(); onConfirm(); }}
        >
          削除する
        </button>
        <button
          className="flex-1 py-2 rounded-lg text-xs font-black text-gray-400 bg-gray-800 active:scale-95 transition-all"
          onPointerDown={(e) => { e.preventDefault(); onCancel(); }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

export default HomeScreen;
