import { motion, AnimatePresence } from 'framer-motion';
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
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      animate={{ opacity: player.isFolded ? 0.4 : 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cards */}
      <div className="flex -space-x-4 mb-1">
        <AnimatePresence mode="popLayout">
          {player.holeCards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              dealDelay={i}
              animateDeal={true}
              className="!w-12 !h-[4.5rem] text-[0.6rem]"
            />
          ))}
        </AnimatePresence>
        {player.holeCards.length === 0 && !player.isFolded && (
          <div className="w-12 h-[4.5rem]" />
        )}
      </div>

      {/* Player info */}
      <motion.div
        className={`rounded-xl px-3 py-1.5 text-center min-w-[7rem] border transition-colors ${
          isCurrent
            ? 'bg-casino-gold/20 border-casino-gold shadow-lg shadow-casino-gold/20'
            : 'bg-casino-surface border-casino-border'
        }`}
        animate={isCurrent ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={isCurrent ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
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
        <AnimatePresence>
          {player.currentBet > 0 && (
            <motion.div
              className="text-[0.6rem] text-gray-400 mt-0.5"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Bet: {player.currentBet.toLocaleString()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status indicators */}
        <AnimatePresence>
          {player.isAllIn && (
            <motion.div
              className="text-[0.6rem] text-casino-red-light font-bold mt-0.5"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              ALL IN
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {player.isFolded && (
            <motion.div
              className="text-[0.6rem] text-gray-500 mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              FOLD
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Timer */}
      <AnimatePresence>
        {isCurrent && timeRemaining !== null && (
          <motion.div
            className="mt-1"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <div className="bg-casino-bg rounded-full h-1.5 w-16 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeRemaining < 10 ? 'bg-casino-red' : 'bg-casino-gold'
                }`}
                style={{ width: `${(timeRemaining / 30) * 100}%` }}
              />
            </div>
            <span className="text-[0.6rem] text-gray-400">{timeRemaining}s</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
