import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { SlotSymbol } from '@casino/shared';
import { SYMBOL_DISPLAY } from '@casino/shared';

// Extra symbols for the spinning animation
const ALL_SYMBOLS: SlotSymbol[] = ['cherry', 'lemon', 'orange', 'plum', 'bell', 'bar', 'seven', 'diamond'];

function randomSymbol(): SlotSymbol {
  return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
}

interface SlotReelProps {
  symbols: SlotSymbol[]; // 3 final symbols (top, mid, bottom)
  spinning: boolean;
  reelIndex: number;
}

export function SlotReel({ symbols, spinning, reelIndex }: SlotReelProps) {
  const [displaySymbols, setDisplaySymbols] = useState<SlotSymbol[]>(symbols);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      // Rapidly cycle through random symbols
      intervalRef.current = setInterval(() => {
        setDisplaySymbols([randomSymbol(), randomSymbol(), randomSymbol()]);
      }, 80);

      // Stop after staggered delay per reel
      const stopDelay = 1000 + reelIndex * 400;
      const stopTimer = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDisplaySymbols(symbols);
      }, stopDelay);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        clearTimeout(stopTimer);
      };
    } else {
      setDisplaySymbols(symbols);
    }
  }, [spinning, symbols, reelIndex]);

  return (
    <div className="flex flex-col items-center bg-casino-bg/80 rounded-lg border border-casino-border overflow-hidden">
      {displaySymbols.map((sym, row) => (
        <motion.div
          key={row}
          className="w-20 h-20 flex items-center justify-center text-4xl border-b border-casino-border/30 last:border-b-0"
          animate={spinning ? { scale: [1, 0.9, 1] } : { scale: 1 }}
          transition={spinning ? { duration: 0.08, repeat: Infinity } : { type: 'spring', stiffness: 300 }}
        >
          {SYMBOL_DISPLAY[sym]}
        </motion.div>
      ))}
    </div>
  );
}
