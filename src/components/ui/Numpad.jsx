/**
 * Numpad component - Fixed number input, no mobile keyboard
 * Layout:
 * [1][2][3]
 * [4][5][6]
 * [7][8][9]
 * [-][0][⌫]
 *    [OK]
 */
import { useState, useCallback, useEffect } from 'react';
import { useSound } from '../../hooks/useSound';

const MAX_LENGTH = 3; // "-" + 2 digits OR 3 digits

export function Numpad({ onSubmit, onInputChange, disabled = false, resetKey = 0 }) {
  const [input, setInput] = useState('');
  const { playNumpad } = useSound();

  // Reset input when resetKey changes (new question)
  useEffect(() => {
    setInput('');
    onInputChange?.('');
  }, [resetKey]);

  const handlePress = useCallback((val) => {
    if (disabled) return;

    if (val === '⌫') {
      const next = input.slice(0, -1);
      setInput(next);
      onInputChange?.(next);
      playNumpad();
      return;
    }

    if (val === 'OK') {
      if (input.length > 0 && input !== '-') {
        onSubmit(input);
        setInput('');
        onInputChange?.('');
      }
      return;
    }

    if (val === '-') {
      // Only allow minus at position 0
      if (input.length === 0) {
        setInput('-');
        onInputChange?.('-');
        playNumpad();
      }
      return;
    }

    // Digit
    const next = input + val;
    if (next.length > MAX_LENGTH) return;

    setInput(next);
    onInputChange?.(next);
    playNumpad();
  }, [input, disabled, onSubmit, onInputChange, playNumpad]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') handlePress(e.key);
      else if (e.key === '-' || e.key === 'Minus') handlePress('-');
      else if (e.key === 'Backspace') handlePress('⌫');
      else if (e.key === 'Enter') handlePress('OK');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePress, disabled]);

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['-', '0', '⌫'],
  ];

  const hasInput = input.length > 0 && input !== '-';

  return (
    <div className="flex flex-col items-center gap-2 w-full select-none">
      {/* Number rows */}
      <div className="flex flex-col gap-2 w-full">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-2 justify-center">
            {row.map((btn) => (
              <NumpadButton
                key={btn}
                label={btn}
                onPress={() => handlePress(btn)}
                disabled={disabled}
                isSpecial={btn === '⌫' || btn === '-'}
              />
            ))}
          </div>
        ))}

        {/* OK button */}
        <div className="flex justify-center mt-1">
          <button
            className={`numpad-btn w-40 h-14 rounded-xl text-xl font-black transition-all duration-100 active:scale-95 ${
              hasInput && !disabled
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 active:bg-red-700'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              handlePress('OK');
            }}
            disabled={!hasInput || disabled}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function NumpadButton({ label, onPress, disabled, isSpecial }) {
  return (
    <button
      className={`numpad-btn flex-1 h-14 rounded-xl text-2xl font-black transition-all duration-75 active:scale-90 ${
        disabled
          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
          : isSpecial
          ? 'bg-gray-700 text-amber-400 active:bg-amber-900/50'
          : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-orange-900/40'
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        if (!disabled) onPress();
      }}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default Numpad;
