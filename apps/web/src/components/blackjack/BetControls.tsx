import { useState } from 'react';

interface BetControlsProps {
  minBet: number;
  maxBet: number;
  balance: number;
  onPlaceBet: (amount: number) => void;
  disabled?: boolean;
}

export function BetControls({ minBet, maxBet, balance, onPlaceBet, disabled }: BetControlsProps) {
  const [bet, setBet] = useState(minBet);
  const effectiveMax = Math.min(maxBet, balance);

  const quickBets = [
    { label: 'Min', value: minBet },
    { label: '1/4', value: Math.floor(effectiveMax / 4) },
    { label: '1/2', value: Math.floor(effectiveMax / 2) },
    { label: 'Max', value: effectiveMax },
  ];

  return (
    <div className="flex flex-col items-center gap-3 bg-casino-surface/80 border border-casino-border rounded-xl p-4">
      <span className="text-sm text-gray-400">Einsatz setzen</span>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={minBet}
          max={effectiveMax}
          step={Math.max(10, Math.floor(minBet / 10) * 10)}
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          className="w-48 accent-casino-gold"
          disabled={disabled}
        />
        <span className="text-lg font-bold text-casino-gold w-20 text-right">
          {bet.toLocaleString()}
        </span>
      </div>

      <div className="flex gap-2">
        {quickBets.map((qb) => (
          <button
            key={qb.label}
            onClick={() => setBet(Math.max(minBet, Math.min(qb.value, effectiveMax)))}
            disabled={disabled}
            className="px-3 py-1 text-xs rounded-lg bg-casino-bg border border-casino-border text-gray-300 hover:text-casino-gold hover:border-casino-gold transition-colors disabled:opacity-50"
          >
            {qb.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPlaceBet(bet)}
        disabled={disabled || bet < minBet || bet > effectiveMax}
        className="mt-1 px-8 py-2 rounded-lg font-semibold bg-casino-gold text-black hover:bg-casino-gold-light transition-colors disabled:opacity-50"
      >
        Setzen
      </button>
    </div>
  );
}
