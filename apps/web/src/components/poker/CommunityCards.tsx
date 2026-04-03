import type { Card } from '@casino/shared';
import { PlayingCard } from '../blackjack/PlayingCard';

interface CommunityCardsProps {
  cards: Card[];
  phase: string;
}

const phaseLabels: Record<string, string> = {
  'poker:pre_flop': 'Pre-Flop',
  'poker:flop': 'Flop',
  'poker:turn': 'Turn',
  'poker:river': 'River',
  'poker:showdown': 'Showdown',
};

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-400 font-medium">
        {phaseLabels[phase] || ''}
      </span>
      <div className="flex gap-2 min-h-[6rem]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-16 h-24">
            {cards[i] ? (
              <PlayingCard card={cards[i]} dealDelay={i} animateDeal={true} />
            ) : (
              <div className="w-16 h-24 rounded-lg border-2 border-dashed border-casino-border/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
