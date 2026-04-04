import { useState } from 'react';

interface BetControlsProps {
  onSpin: (bet: number) => void;
  disabled: boolean;
  balance: number;
}

const QUICK_BETS = [10, 50, 100, 500, 1000];

export function BetControls({ onSpin, disabled, balance }: BetControlsProps) {
  const [bet, setBet] = useState(100);

  const clampedBet = Math.min(Math.max(bet, 10), Math.min(5000, balance));

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Quick bet buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {QUICK_BETS.map((amount) => (
          <button
            key={amount}
            onClick={() => setBet(amount)}
            disabled={amount > balance}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              bet === amount
                ? 'bg-casino-gold text-black'
                : 'bg-casino-surface border border-casino-border text-gray-300 hover:border-casino-gold/50'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {amount.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Bet slider */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <span className="text-xs text-gray-400">10</span>
        <input
          type="range"
          min={10}
          max={Math.min(5000, balance)}
          step={10}
          value={clampedBet}
          onChange={(e) => setBet(Number(e.target.value))}
          className="flex-1 accent-casino-gold"
        />
        <span className="text-xs text-gray-400">
          {Math.min(5000, balance).toLocaleString()}
        </span>
      </div>

      <div className="text-sm text-gray-300">
        Einsatz: <span className="text-casino-gold font-bold">{clampedBet.toLocaleString()}</span>
      </div>

      {/* Spin button */}
      <button
        onClick={() => onSpin(clampedBet)}
        disabled={disabled || balance < 10}
        className="relative px-12 py-4 bg-gradient-to-b from-casino-gold to-yellow-600 text-black font-bold text-xl rounded-2xl shadow-lg shadow-casino-gold/30 hover:from-yellow-400 hover:to-yellow-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {disabled ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Dreht...
          </span>
        ) : (
          'SPIN'
        )}
      </button>
    </div>
  );
}
