import { useState } from 'react';
import { getLobbySocket } from '../../lib/socket';
import type { GameType } from '@casino/shared';

interface CreateTableDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTableDialog({ open, onClose }: CreateTableDialogProps) {
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState<GameType>('blackjack' as GameType);

  // Blackjack config
  const [minBet, setMinBet] = useState(100);
  const [maxBet, setMaxBet] = useState(10000);

  // Poker config
  const [smallBlind, setSmallBlind] = useState(50);
  const [bigBlind, setBigBlind] = useState(100);
  const [minBuyIn, setMinBuyIn] = useState(2000);
  const [maxBuyIn, setMaxBuyIn] = useState(20000);

  if (!open) return null;

  const handleCreate = () => {
    if (!name.trim()) return;

    const config =
      gameType === 'blackjack'
        ? { minBet, maxBet }
        : { smallBlind, bigBlind, minBuyIn, maxBuyIn };

    getLobbySocket()?.emit('lobby:create_table', {
      gameType,
      name: name.trim(),
      config,
    });

    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-casino-surface border border-casino-border rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-casino-gold mb-4">Neuer Tisch</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tisch-Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Mein Tisch"
              maxLength={64}
              className="w-full bg-casino-bg border border-casino-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Spiel</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGameType('blackjack' as GameType)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gameType === 'blackjack'
                    ? 'bg-casino-gold text-black'
                    : 'bg-casino-bg border border-casino-border text-gray-400 hover:text-white'
                }`}
              >
                Blackjack
              </button>
              <button
                type="button"
                onClick={() => setGameType('poker' as GameType)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gameType === 'poker'
                    ? 'bg-casino-gold text-black'
                    : 'bg-casino-bg border border-casino-border text-gray-400 hover:text-white'
                }`}
              >
                Poker
              </button>
            </div>
          </div>

          {gameType === 'blackjack' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min. Einsatz</label>
                <input
                  type="number"
                  value={minBet}
                  onChange={(e) => setMinBet(Number(e.target.value))}
                  min={10}
                  className="w-full bg-casino-bg border border-casino-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max. Einsatz</label>
                <input
                  type="number"
                  value={maxBet}
                  onChange={(e) => setMaxBet(Number(e.target.value))}
                  min={100}
                  className="w-full bg-casino-bg border border-casino-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Small Blind</label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(Number(e.target.value))}
                  min={10}
                  className="w-full bg-casino-bg border border-casino-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Big Blind</label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(Number(e.target.value))}
                  min={20}
                  className="w-full bg-casino-bg border border-casino-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min. Buy-In</label>
                <input
                  type="number"
                  value={minBuyIn}
                  onChange={(e) => setMinBuyIn(Number(e.target.value))}
                  min={100}
                  className="w-full bg-casino-bg border border-casino-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max. Buy-In</label>
                <input
                  type="number"
                  value={maxBuyIn}
                  onChange={(e) => setMaxBuyIn(Number(e.target.value))}
                  min={1000}
                  className="w-full bg-casino-bg border border-casino-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-casino-gold transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-casino-bg border border-casino-border text-gray-400 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-casino-gold text-black hover:bg-casino-gold-light transition-colors disabled:opacity-50"
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
