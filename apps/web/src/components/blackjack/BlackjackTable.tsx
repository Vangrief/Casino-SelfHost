import { motion, AnimatePresence } from 'framer-motion';
import type { BlackjackClientState } from '@casino/shared';
import { useAuthStore } from '../../stores/auth.store';
import { DealerHand } from './DealerHand';
import { Hand } from './Hand';
import { BetControls } from './BetControls';
import { ActionButtons } from './ActionButtons';

interface BlackjackTableProps {
  state: BlackjackClientState;
  onPlaceBet: (amount: number) => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
}

export function BlackjackTable({
  state,
  onPlaceBet,
  onHit,
  onStand,
  onDouble,
  onSplit,
}: BlackjackTableProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const isMyTurn = state.currentPlayerId === userId;

  const myPlayer = state.players.find((p) => p.id === userId);
  const myHand = myPlayer?.hands[myPlayer.currentHandIndex];

  // Determine config from state (basic fallback)
  const minBet = 100;
  const maxBet = 10000;

  const hasBet = myPlayer && myPlayer.hands.length > 0 && myPlayer.hands.some((h) => h.bet > 0);

  const canHit = isMyTurn && !!myHand && !myHand.isBusted && !myHand.isBlackjack;
  const canStand = isMyTurn && !!myHand && !myHand.isBusted;
  const canDouble = isMyTurn && !!myHand && myHand.cards.length === 2 && !myHand.isBusted;
  const canSplit =
    isMyTurn &&
    !!myHand &&
    myHand.cards.length === 2 &&
    !('hidden' in myHand.cards[0]) &&
    !('hidden' in myHand.cards[1]) &&
    !('hidden' in myHand.cards[0]) &&
    (myHand.cards[0] as { rank: string }).rank === (myHand.cards[1] as { rank: string }).rank;

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Table felt */}
      <div className="w-full max-w-4xl bg-gradient-to-b from-casino-felt to-casino-felt-light rounded-3xl border-4 border-casino-border p-8 shadow-2xl">
        {/* Dealer area */}
        <div className="flex justify-center mb-8">
          {state.dealerHand.cards.length > 0 ? (
            <DealerHand cards={state.dealerHand.cards} value={state.dealerHand.value} />
          ) : (
            <div className="text-gray-500 text-sm py-10">Warten auf Einsätze...</div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-casino-border/50 my-4" />

        {/* Phase indicator */}
        <div className="text-center mb-4">
          <PhaseLabel phase={state.phase} />
        </div>

        {/* Players */}
        <div className="flex justify-center gap-8 flex-wrap">
          {state.players.map((player) => {
            const isMe = player.id === userId;
            const isCurrent = player.id === state.currentPlayerId;

            return (
              <div
                key={player.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-casino-gold/10 border border-casino-gold/30'
                    : 'border border-transparent'
                }`}
              >
                <span className={`text-sm font-medium ${isMe ? 'text-casino-gold' : 'text-gray-300'}`}>
                  {player.displayName} {isMe && '(Du)'}
                </span>

                {player.hands.length > 0 ? (
                  <div className="flex gap-3">
                    {player.hands.map((hand, i) => (
                      <Hand
                        key={i}
                        hand={hand}
                        isActive={isCurrent && i === player.currentHandIndex}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs py-4">
                    {state.phase === 'bj:betting' ? 'Setzt Einsatz...' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <AnimatePresence mode="wait">
      {state.phase === 'bj:betting' && !hasBet && (
        <motion.div
          key="bet-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <BetControls
            minBet={minBet}
            maxBet={maxBet}
            balance={balance}
            onPlaceBet={onPlaceBet}
          />
        </motion.div>
      )}

      {state.phase === 'bj:betting' && hasBet && (
        <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="text-casino-gold font-medium">Warte auf andere Spieler...</div>
        </motion.div>
      )}

      {state.phase === 'bj:player_turn' && isMyTurn && (
        <motion.div
          key="actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
        >
          <ActionButtons
            canHit={canHit}
            canStand={canStand}
            canDouble={canDouble}
            canSplit={canSplit}
            onHit={onHit}
            onStand={onStand}
            onDouble={onDouble}
            onSplit={onSplit}
          />
        </motion.div>
      )}

      {state.phase === 'bj:player_turn' && !isMyTurn && (
        <motion.div key="wait-player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="text-gray-400 text-sm">
            Warte auf {state.players.find((p) => p.id === state.currentPlayerId)?.displayName}...
          </div>
        </motion.div>
      )}

      {state.phase === 'bj:payout' && (
        <motion.div
          key="payout"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="text-casino-gold font-bold text-lg">Auszahlung...</div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Shoe info */}
      <div className="text-xs text-gray-500">
        Shoe: {state.shoe.remaining}/{state.shoe.total} Karten
      </div>
    </div>
  );
}

function PhaseLabel({ phase }: { phase: string }) {
  const labels: Record<string, string> = {
    'bj:betting': 'Einsätze platzieren',
    'bj:dealing': 'Karten werden ausgeteilt...',
    'bj:player_turn': 'Spieler am Zug',
    'bj:dealer_turn': 'Dealer spielt...',
    'bj:payout': 'Ergebnis',
  };

  return (
    <span className="text-sm text-gray-400 font-medium">
      {labels[phase] || phase}
    </span>
  );
}
