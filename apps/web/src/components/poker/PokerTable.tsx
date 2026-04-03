import type { PokerClientState } from '@casino/shared';
import { useAuthStore } from '../../stores/auth.store';
import { CommunityCards } from './CommunityCards';
import { PlayerSeat } from './PlayerSeat';
import { PokerActions } from './PokerActions';

// Oval seat positions (percentages) for up to 8 players
const SEAT_POSITIONS: { x: string; y: string }[] = [
  { x: '50%', y: '90%' },   // 0: bottom center (usually "me")
  { x: '15%', y: '75%' },   // 1: bottom left
  { x: '5%', y: '45%' },    // 2: left
  { x: '15%', y: '15%' },   // 3: top left
  { x: '50%', y: '5%' },    // 4: top center
  { x: '85%', y: '15%' },   // 5: top right
  { x: '95%', y: '45%' },   // 6: right
  { x: '85%', y: '75%' },   // 7: bottom right
];

interface PokerTableProps {
  state: PokerClientState;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
}

export function PokerTable({
  state, onFold, onCheck, onCall, onRaise, onAllIn,
}: PokerTableProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const isMyTurn = state.currentPlayerId === userId;

  const myPlayer = state.players.find((p) => p.id === userId);
  const myCurrentBet = myPlayer?.currentBet || 0;

  // Compute highest bet in current round
  const highestBet = Math.max(...state.players.map((p) => p.currentBet), 0);
  const callAmount = highestBet - myCurrentBet;
  const canCheck = myCurrentBet >= highestBet;
  const canCall = callAmount > 0;

  // Reorder players so current user is at seat 0
  const myIndex = state.players.findIndex((p) => p.id === userId);
  const reorderedPlayers = myIndex >= 0
    ? [...state.players.slice(myIndex), ...state.players.slice(0, myIndex)]
    : state.players;

  const totalPot = state.pots.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Table */}
      <div className="relative w-full max-w-4xl" style={{ paddingBottom: '55%' }}>
        {/* Oval felt */}
        <div
          className="absolute inset-[8%] rounded-[50%] bg-gradient-to-b from-casino-felt to-casino-felt-light border-4 border-casino-border shadow-2xl"
        />

        {/* Inner border */}
        <div
          className="absolute inset-[10%] rounded-[50%] border-2 border-casino-gold/20"
        />

        {/* Center: Community cards + pot */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <CommunityCards cards={state.communityCards} phase={state.phase} />
          {totalPot > 0 && (
            <div className="bg-casino-bg/70 rounded-full px-4 py-1.5">
              <span className="text-casino-gold font-bold text-sm">
                Pot: {totalPot.toLocaleString()}
              </span>
              {state.pots.length > 1 && (
                <span className="text-gray-400 text-xs ml-2">
                  ({state.pots.length} Pots)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Player seats */}
        {reorderedPlayers.map((player, i) => {
          const pos = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
          return (
            <PlayerSeat
              key={player.id}
              player={player}
              isMe={player.id === userId}
              isCurrent={player.id === state.currentPlayerId}
              isDealer={player.seatNumber === state.dealerSeat}
              position={pos}
              timeRemaining={player.id === state.currentPlayerId ? state.timeRemaining : null}
            />
          );
        })}
      </div>

      {/* Actions */}
      {isMyTurn && myPlayer && !myPlayer.isFolded && !myPlayer.isAllIn && (
        <PokerActions
          canCheck={canCheck}
          canCall={canCall}
          callAmount={callAmount}
          minRaise={state.minRaise}
          maxRaise={(myPlayer.chipCount || 0) + myCurrentBet}
          onFold={onFold}
          onCheck={onCheck}
          onCall={onCall}
          onRaise={onRaise}
          onAllIn={onAllIn}
        />
      )}

      {isMyTurn === false && state.phase !== 'poker:waiting' && state.phase !== 'poker:showdown' && (
        <div className="text-gray-400 text-sm">
          Warte auf {state.players.find((p) => p.id === state.currentPlayerId)?.displayName}...
        </div>
      )}

      {state.phase === 'poker:waiting' && (
        <div className="text-gray-400 text-sm">Warte auf Spieler...</div>
      )}

      {state.phase === 'poker:showdown' && (
        <div className="text-casino-gold font-bold text-lg">Showdown!</div>
      )}
    </div>
  );
}
