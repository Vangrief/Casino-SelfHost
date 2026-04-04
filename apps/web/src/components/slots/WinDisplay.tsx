import { motion, AnimatePresence } from 'framer-motion';
import type { SlotWinLine } from '@casino/shared';
import { SYMBOL_DISPLAY } from '@casino/shared';

interface WinDisplayProps {
  winLines: SlotWinLine[];
  totalWin: number;
}

export function WinDisplay({ winLines, totalWin }: WinDisplayProps) {
  if (totalWin === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <motion.div
          className="text-3xl font-bold text-casino-gold"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, repeat: 2 }}
        >
          +{totalWin.toLocaleString()} Chips!
        </motion.div>

        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {winLines.map((wl) => (
            <motion.div
              key={wl.lineIndex}
              className="bg-casino-gold/10 border border-casino-gold/30 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: wl.lineIndex * 0.1 }}
            >
              <span className="text-lg">
                {wl.symbols.map((s) => SYMBOL_DISPLAY[s]).join('')}
              </span>
              <span className="text-casino-gold font-medium">
                ×{wl.multiplier}
              </span>
              <span className="text-gray-400">
                = {wl.payout.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
