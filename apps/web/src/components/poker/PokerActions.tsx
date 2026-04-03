import { useState } from 'react';

interface PokerActionsProps {
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  minRaise: number;
  maxRaise: number;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
}

export function PokerActions({
  canCheck, canCall, callAmount, minRaise, maxRaise,
  onFold, onCheck, onCall, onRaise, onAllIn,
}: PokerActionsProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const handleRaise = () => {
    onRaise(raiseAmount);
    setShowRaiseSlider(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {showRaiseSlider && (
        <div className="flex items-center gap-3 bg-casino-surface/80 border border-casino-border rounded-xl px-4 py-3">
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={Math.max(10, Math.floor(minRaise / 10))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-40 accent-casino-gold"
          />
          <span className="text-casino-gold font-bold w-20 text-right">
            {raiseAmount.toLocaleString()}
          </span>
          <button
            onClick={handleRaise}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-casino-gold text-black hover:bg-casino-gold-light transition-colors"
          >
            Raise
          </button>
          <button
            onClick={() => setShowRaiseSlider(false)}
            className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
            X
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onFold}
          className="px-6 py-2.5 rounded-lg font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          Fold
        </button>

        {canCheck && (
          <button
            onClick={onCheck}
            className="px-6 py-2.5 rounded-lg font-semibold bg-green-700 text-white hover:bg-green-600 transition-colors"
          >
            Check
          </button>
        )}

        {canCall && (
          <button
            onClick={onCall}
            className="px-6 py-2.5 rounded-lg font-semibold bg-blue-700 text-white hover:bg-blue-600 transition-colors"
          >
            Call {callAmount.toLocaleString()}
          </button>
        )}

        <button
          onClick={() => {
            setRaiseAmount(minRaise);
            setShowRaiseSlider(!showRaiseSlider);
          }}
          className="px-6 py-2.5 rounded-lg font-semibold bg-casino-gold text-black hover:bg-casino-gold-light transition-colors"
        >
          Raise
        </button>

        <button
          onClick={onAllIn}
          className="px-6 py-2.5 rounded-lg font-semibold bg-casino-red text-white hover:bg-casino-red-light transition-colors"
        >
          All In
        </button>
      </div>
    </div>
  );
}
