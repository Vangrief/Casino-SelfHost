import type { PokerClientState } from '@casino/shared';
import { PlayingCard } from '../blackjack/PlayingCard';

type PokerPlayerState = PokerClientState['players'][number];

interface PlayerSeatProps {
  player: PokerPlayerState;
  isMe: boolean;
  isCurrent: boolean;
  isDealer: boolean;
  position: { x: string; y: string };
  timeRemaining: number | null;
}

export function PlayerSeat({ player, isMe, isCurrent, isDealer, position, timeRemaining }: PlayerSeatProps) {
  const opacity = player.isFolded ? 'opacity-40' : 'opacity-100';

  return (
    <div
      className={`absolute flex flex-col items-center gap-1 transition-all ${opacity}`}
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
    >
      {/* Cards */}
      <div className="flex -space-x-4 mb-1">
        {player.holeCards.map((card, i) => (
          <PlayingCard key={i} card={card} className="!w-12 !h-[4.5rem] text-[0.6rem]" />
        ))}
        {player.holeCards.length === 0 && !player.isFolded && (
          <div className="w-12 h-[4.5rem]" />
        )}
      </div>

      {/* Player info */}
      <div
        className={`rounded-xl px-3 py-1.5 text-center min-w-[7rem] border transition-all ${
          isCurrent
            ? 'bg-casino-gold/20 border-casino-gold shadow-lg shadow-casino-gold/20'
            : 'bg-casino-surface border-casino-border'
        }`}
      >
        <div className="flex items-center justify-center gap-1.5">
          {isDealer && (
            <span className="bg-yellow-500 text-black text-[0.6rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              D
            </span>
          )}
          <span className={`text-xs font-medium truncate ${isMe ? 'text-casino-gold' : 'text-white'}`}>
            {player.displayName}
          </span>
        </div>
        <div className="text-[0.65rem] text-casino-gold-light font-medium">
          {player.chipCount.toLocaleString()}
        </div>

        {/* Current bet */}
        {player.currentBet > 0 && (
          <div className="text-[0.6rem] text-gray-400 mt-0.5">
            Bet: {player.currentBet.toLocaleString()}
          </div>
        )}

        {/* Status indicators */}
        {player.isAllIn && (
          <div className="text-[0.6rem] text-casino-red-light font-bold mt-0.5">ALL IN</div>
        )}
        {player.isFolded && (
          <div className="text-[0.6rem] text-gray-500 mt-0.5">FOLD</div>
        )}
      </div>

      {/* Timer */}
      {isCurrent && timeRemaining !== null && (
        <div className="mt-1">
          <div className="bg-casino-bg rounded-full h-1.5 w-16 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeRemaining < 10 ? 'bg-casino-red' : 'bg-casino-gold'
              }`}
              style={{ width: `${(timeRemaining / 30) * 100}%` }}
            />
          </div>
          <span className="text-[0.6rem] text-gray-400">{timeRemaining}s</span>
        </div>
      )}
    </div>
  );
}
