import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { usePokerSocket } from '../hooks/usePokerSocket';
import { PokerTable } from '../components/poker/PokerTable';
import { useAuthStore } from '../stores/auth.store';

export function PokerGamePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const buyIn = parseInt(searchParams.get('buyIn') || '5000', 10);
  const { gameState, error, payoutResult, emit } = usePokerSocket(tableId!, buyIn);

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
              : 'bg-casino-red/20 border border-casino-red text-casino-red-light'
          }`}
        >
          {myPayout.amount > 0
            ? `+${myPayout.amount.toLocaleString()} Chips gewonnen!`
            : `Keine Chips gewonnen`}
          {payoutResult.hands && payoutResult.hands[userId!] && (
            <div className="text-sm mt-1 font-normal">
              {payoutResult.hands[userId!]}
            </div>
          )}
        </div>
      )}

      <PokerTable
        state={gameState}
        onFold={() => emit('poker:fold')}
        onCheck={() => emit('poker:check')}
        onCall={() => emit('poker:call')}
        onRaise={(amount) => emit('poker:raise', { amount })}
        onAllIn={() => emit('poker:all_in')}
      />
    </div>
  );
}
