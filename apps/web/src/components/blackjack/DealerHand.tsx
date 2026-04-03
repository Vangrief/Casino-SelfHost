import { motion } from 'framer-motion';
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
      <div className="relative" style={{ height: '6rem', width: `${Math.max(1, cards.length) * 40 + 24}px` }}>
        {cards.map((card, i) => (
          <div
            key={i}
            className="absolute top-0"
            style={{ left: `${i * 40}px`, zIndex: i }}
          >
            <PlayingCard
              card={card}
              dealDelay={i + 2}
              animateDeal={true}
            />
          </div>
        ))}
      </div>
      {value !== null && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-lg font-bold ${value > 21 ? 'text-casino-red-light' : 'text-white'}`}
        >
          {value > 21 ? `BUST (${value})` : value}
        </motion.span>
      )}
    </div>
  );
}
