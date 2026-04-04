import { motion } from 'framer-motion';
import type { SlotsClientState, SlotSymbol } from '@casino/shared';
import { WIN_LINES, SYMBOL_DISPLAY } from '@casino/shared';
import { SlotReel } from './SlotReel';
import { WinDisplay } from './WinDisplay';
import { BetControls } from './BetControls';
import { useAuthStore } from '../../stores/auth.store';

interface SlotMachineProps {
  state: SlotsClientState;
  isSpinning: boolean;
  onSpin: (bet: number) => void;
}

export function SlotMachine({ state, isSpinning, onSpin }: SlotMachineProps) {
  const balance = useAuthStore((s) => s.user?.balance ?? 0);

  // Default empty grid
  const reels = state.reels.length > 0
    ? state.reels
    : Array.from({ length: 5 }, (): SlotSymbol[] => ['cherry', 'cherry', 'cherry']);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Machine frame */}
      <div className="bg-gradient-to-b from-casino-surface to-casino-bg border-2 border-casino-gold/30 rounded-3xl p-6 shadow-2xl shadow-casino-gold/10 max-w-xl w-full">
        {/* Title */}
        <motion.h2
          className="text-center text-2xl font-bold text-casino-gold mb-4"
          animate={isSpinning ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={isSpinning ? { duration: 0.5, repeat: Infinity } : {}}
        >
          Slot Machine
        </motion.h2>

        {/* Reels */}
        <div className="flex gap-2 justify-center mb-2">
          {reels.map((reelSymbols, i) => (
            <SlotReel
              key={i}
              symbols={reelSymbols}
              spinning={isSpinning}
              reelIndex={i}
            />
          ))}
        </div>

        {/* Win lines indicator */}
        <div className="text-center text-xs text-gray-500 mb-4">
          {WIN_LINES.length} Gewinnlinien
        </div>

        {/* Win display */}
        {state.phase === 'slots:result' && state.totalWin > 0 && (
          <div className="mb-4">
            <WinDisplay winLines={state.winLines} totalWin={state.totalWin} />
          </div>
        )}

        {state.phase === 'slots:result' && state.totalWin === 0 && (
          <div className="text-center text-gray-500 text-sm mb-4">
            Kein Gewinn — Viel Erfolg beim nächsten Spin!
          </div>
        )}
      </div>

      {/* Controls */}
      <BetControls
        onSpin={onSpin}
        disabled={isSpinning}
        balance={balance}
      />

      {/* Paytable */}
      <details className="w-full max-w-xl">
        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors text-center">
          Gewinntabelle anzeigen
        </summary>
        <div className="mt-3 bg-casino-surface border border-casino-border rounded-xl p-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="font-bold text-gray-400">Symbol</div>
            <div className="font-bold text-gray-400 text-center">×3</div>
            <div className="font-bold text-gray-400 text-center">×4</div>
            <div className="font-bold text-gray-400 text-center">×5</div>
            {(
              [
                ['diamond', 100, 500, 2000],
                ['seven', 50, 150, 500],
                ['bar', 20, 60, 150],
                ['bell', 10, 30, 75],
                ['plum', 5, 15, 30],
                ['orange', 4, 10, 20],
                ['lemon', 3, 8, 15],
                ['cherry', 2, 5, 10],
              ] as const
            ).map(([sym, three, four, five]) => (
              <div key={sym} className="contents">
                <div className="flex items-center gap-1">
                  <span className="text-lg">{SYMBOL_DISPLAY[sym]}</span>
                </div>
                <div className="text-center text-gray-300">{three}×</div>
                <div className="text-center text-gray-300">{four}×</div>
                <div className="text-center text-casino-gold font-bold">{five}×</div>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
