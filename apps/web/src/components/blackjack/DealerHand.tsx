import { motion, AnimatePresence } from 'framer-motion';
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
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => {
            const cardKey = 'hidden' in card
              ? `hidden-${i}`
              : `${(card as { rank: string; suit: string }).rank}-${(card as { rank: string; suit: string }).suit}-${i}`;
            return (
              <PlayingCard
                key={cardKey}
                card={card}
                dealDelay={i + 2}
                animateDeal={true}
              />
            );
          })}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {value !== null && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-lg font-bold ${value > 21 ? 'text-casino-red-light' : 'text-white'}`}
          >
            {value > 21 ? `BUST (${value})` : value}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
