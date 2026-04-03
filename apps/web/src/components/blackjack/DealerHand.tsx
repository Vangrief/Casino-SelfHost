import type { VisibleOrHiddenCard } from '@casino/shared';
import { PlayingCard } from './PlayingCard';

interface DealerHandProps {
  cards: VisibleOrHiddenCard[];
  value: number | null;
}

export function DealerHand({ cards, value }: DealerHandProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-400 font-medium">Dealer</span>
      <div className="flex -space-x-6">
        {cards.map((card, i) => (
          <PlayingCard key={i} card={card} />
        ))}
      </div>
      {value !== null && (
        <span className={`text-lg font-bold ${value > 21 ? 'text-casino-red-light' : 'text-white'}`}>
          {value > 21 ? `BUST (${value})` : value}
        </span>
      )}
    </div>
  );
}
