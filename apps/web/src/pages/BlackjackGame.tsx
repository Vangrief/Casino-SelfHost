import { useParams, useNavigate } from 'react-router-dom';
import { useBlackjackSocket } from '../hooks/useBlackjackSocket';
import { BlackjackTable } from '../components/blackjack/BlackjackTable';
import { useAuthStore } from '../stores/auth.store';

export function BlackjackGamePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const { gameState, error, payoutResult, emit } = useBlackjackSocket(tableId!);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Verbinde mit Tisch...</div>
      </div>
    );
  }

  const myPayout = payoutResult?.payouts.find((p) => p.playerId === userId);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          &larr; Zurück zur Lobby
        </button>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-4 bg-casino-red/20 border border-casino-red text-casino-red-light rounded-lg p-3 text-sm text-center">
          {error}
        </div>
      )}

      {payoutResult && myPayout && (
        <div
          className={`max-w-md mx-auto mb-4 rounded-lg p-4 text-center font-bold text-lg ${
            myPayout.amount > 0
              ? 'bg-green-900/30 border border-green-700 text-green-400'
              : myPayout.amount < 0
                ? 'bg-casino-red/20 border border-casino-red text-casino-red-light'
                : 'bg-casino-gold/10 border border-casino-gold/30 text-casino-gold'
          }`}
        >
          {myPayout.amount > 0
            ? `+${myPayout.amount.toLocaleString()} Chips gewonnen!`
            : myPayout.amount < 0
              ? `${myPayout.amount.toLocaleString()} Chips verloren`
              : 'Push - Einsatz zurück'}
        </div>
      )}

      <BlackjackTable
        state={gameState}
        onPlaceBet={(amount) => emit('bj:place_bet', { amount })}
        onHit={() => emit('bj:hit')}
        onStand={() => emit('bj:stand')}
        onDouble={() => emit('bj:double_down')}
        onSplit={() => emit('bj:split')}
      />
    </div>
  );
}
