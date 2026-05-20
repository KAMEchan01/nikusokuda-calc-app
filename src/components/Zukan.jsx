/**
 * Zukan - 肉図鑑 (Meat Encyclopedia) modal
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import { getZukan } from '../utils/storage';
import MEATS, { ALL_MEAT_NAMES } from '../data/meats';

const RARITY_CONFIG = {
  common: { label: 'コモン', color: '#9ca3af', stars: 1 },
  rare: { label: 'レア', color: '#60a5fa', stars: 2 },
  legendary: { label: '伝説', color: '#f59e0b', stars: 3 },
};

export function Zukan({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const { playSelect } = useSound();

  const unlocked = getZukan();
  const unlockedSet = new Set(unlocked);

  const filters = [
    { id: 'all', label: '全て' },
    { id: 'unlocked', label: '獲得済み' },
    { id: 'common', label: 'コモン' },
    { id: 'rare', label: 'レア' },
    { id: 'legendary', label: '伝説' },
  ];

  const filteredMeats = ALL_MEAT_NAMES.filter(name => {
    const meat = MEATS[name];
    if (filter === 'unlocked') return unlockedSet.has(name);
    if (filter === 'all') return true;
    return meat.rarity === filter;
  });

  const handleSelect = useCallback((name) => {
    if (!unlockedSet.has(name)) return;
    playSelect();
    setSelected(name);
  }, [unlockedSet, playSelect]);

  const selectedMeat = selected ? MEATS[selected] : null;
  const rarityConfig = selectedMeat ? RARITY_CONFIG[selectedMeat.rarity] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #1a1008 0%, #0d0804 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-white text-xl font-black">📖 肉図鑑</h2>
          <p className="text-gray-500 text-xs">
            {unlocked.length} / {ALL_MEAT_NAMES.length} 種獲得
          </p>
        </div>
        <button
          className="w-10 h-10 rounded-full bg-gray-800 text-white font-bold text-lg flex items-center justify-center active:scale-90 transition-all"
          onPointerDown={(e) => { e.preventDefault(); playSelect(); onClose(); }}
        >
          ✕
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
        {filters.map(f => (
          <button
            key={f.id}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f.id
                ? 'bg-amber-500 text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
            onPointerDown={(e) => { e.preventDefault(); setFilter(f.id); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {filteredMeats.map(name => {
            const meat = MEATS[name];
            const isUnlocked = unlockedSet.has(name);
            const rc = RARITY_CONFIG[meat.rarity];

            return (
              <motion.button
                key={name}
                whileTap={{ scale: 0.92 }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'border-gray-700 bg-gray-900/60'
                    : 'border-gray-800 bg-gray-900/30 cursor-default'
                } ${selected === name ? 'border-amber-500 bg-amber-900/20' : ''}`}
                onPointerDown={(e) => { e.preventDefault(); handleSelect(name); }}
              >
                <span
                  className={`text-2xl ${!isUnlocked ? 'zukan-card-locked' : ''}`}
                  style={{ filter: !isUnlocked ? 'brightness(0) saturate(0)' : undefined }}
                >
                  {meat.emoji}
                </span>
                <span
                  className="text-center leading-tight"
                  style={{
                    fontSize: '9px',
                    color: isUnlocked ? (rc?.color || '#9ca3af') : '#374151',
                    fontWeight: 'bold',
                  }}
                >
                  {isUnlocked ? name : '???'}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && selectedMeat && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="border-t border-gray-700 px-4 py-4 bg-gray-950"
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl">{selectedMeat.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-black text-base">{selected}</h3>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: rarityConfig?.color,
                      background: `${rarityConfig?.color}20`,
                      border: `1px solid ${rarityConfig?.color}50`,
                    }}
                  >
                    {rarityConfig?.label}
                  </span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{selectedMeat.description}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {Array.from({ length: rarityConfig?.stars || 1 }).map(() => '⭐').join('')}
                </p>
              </div>
              <button
                className="text-gray-600 text-lg active:scale-90"
                onPointerDown={(e) => { e.preventDefault(); setSelected(null); }}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Zukan;
