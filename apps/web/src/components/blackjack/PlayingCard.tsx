import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VisibleOrHiddenCard, Card } from '@casino/shared';

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-white',
  spades: 'text-white',
};

interface PlayingCardProps {
  card: VisibleOrHiddenCard;
  className?: string;
  /** Index-based delay for staggered dealing */
  dealDelay?: number;
  /** Animate the deal (slide in from top) */
  animateDeal?: boolean;
}

function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-16 h-24 rounded-lg bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-blue-700 flex items-center justify-center shadow-lg backface-hidden ${className}`}
    >
      <div className="w-10 h-16 rounded border border-blue-600 bg-blue-900/50 flex items-center justify-center">
        <span className="text-blue-400 text-xl font-bold">?</span>
      </div>
    </div>
  );
}

function CardFace({ card, className = '' }: { card: Card; className?: string }) {
  const symbol = SUIT_SYMBOLS[card.suit] || '';
  const color = SUIT_COLORS[card.suit] || 'text-white';

  return (
    <div
      className={`w-16 h-24 rounded-lg bg-white border border-gray-300 flex flex-col items-center justify-between p-1.5 shadow-lg backface-hidden ${className}`}
    >
      <div className={`self-start text-xs font-bold leading-none ${color}`}>
        <div>{card.rank}</div>
        <div>{symbol}</div>
      </div>
      <div className={`text-2xl ${color}`}>{symbol}</div>
      <div className={`self-end text-xs font-bold leading-none rotate-180 ${color}`}>
        <div>{card.rank}</div>
        <div>{symbol}</div>
      </div>
    </div>
  );
}

export function PlayingCard({
  card,
  className = '',
  dealDelay = 0,
  animateDeal = true,
}: PlayingCardProps) {
  const isHidden = 'hidden' in card;
  const prevHiddenRef = useRef(isHidden);
  const [isFlipping, setIsFlipping] = useState(false);

  // Detect when card changes from hidden to visible (flip animation)
  useEffect(() => {
    if (prevHiddenRef.current && !isHidden) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(timer);
    }
    prevHiddenRef.current = isHidden;
  }, [isHidden]);

  // Deal animation wrapper
  const dealVariants = {
    initial: animateDeal ? { y: -120, opacity: 0, scale: 0.7 } : {},
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
        delay: dealDelay * 0.15,
      },
    },
  };

  // Flip animation
  if (isFlipping && !isHidden) {
    return (
      <motion.div
        className={`relative ${className}`}
        style={{ perspective: 600 }}
        initial="initial"
        animate="animate"
        variants={dealVariants}
      >
        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 180 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Back (visible at start of flip) */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
            <CardBack />
          </div>
          {/* Front (visible at end of flip) */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardFace card={card as Card} />
          </div>
        </motion.div>
        {/* Invisible spacer for layout */}
        <div className="w-16 h-24 invisible" />
      </motion.div>
    );
  }

  // Static card (hidden or visible) with deal-in animation
  return (
    <motion.div
      className={className}
      initial={dealVariants.initial}
      animate={dealVariants.animate}
    >
      {isHidden ? <CardBack /> : <CardFace card={card as Card} />}
    </motion.div>
  );
}
