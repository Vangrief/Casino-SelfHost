import type { BlackjackPlayerHand } from '@casino/shared';
import { PlayingCard } from './PlayingCard';

interface HandProps {
  hand: BlackjackPlayerHand;
  isActive?: boolean;
}

export function Hand({ hand, isActive = false }: HandProps) {
  return (
    <div className={`flex flex-col items-center gap-1 ${isActive ? 'ring-2 ring-casino-gold rounded-xl p-2' : 'p-2'}`}>
      <div className="flex -space-x-6">
        {hand.cards.map((card, i) => (
          <PlayingCard key={i} card={card} className={i > 0 ? 'relative' : ''} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`text-sm font-bold ${
            hand.isBusted
              ? 'text-casino-red-light'
              : hand.isBlackjack
                ? 'text-casino-gold'
                : 'text-white'
          }`}
        >
          {hand.isBusted ? 'BUST' : hand.isBlackjack ? 'BLACKJACK!' : hand.value}
        </span>
        {hand.bet > 0 && (
          <span className="text-xs text-casino-gold bg-casino-bg/60 px-2 py-0.5 rounded-full">
            {hand.bet.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
