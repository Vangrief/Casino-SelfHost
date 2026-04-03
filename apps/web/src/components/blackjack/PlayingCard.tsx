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
}

export function PlayingCard({ card, className = '' }: PlayingCardProps) {
  if ('hidden' in card) {
    return (
      <div
        className={`w-16 h-24 rounded-lg bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-blue-700 flex items-center justify-center shadow-lg ${className}`}
      >
        <div className="w-10 h-16 rounded border border-blue-600 bg-blue-900/50 flex items-center justify-center">
          <span className="text-blue-400 text-xl font-bold">?</span>
        </div>
      </div>
    );
  }

  const c = card as Card;
  const symbol = SUIT_SYMBOLS[c.suit] || '';
  const color = SUIT_COLORS[c.suit] || 'text-white';

  return (
    <div
      className={`w-16 h-24 rounded-lg bg-white border border-gray-300 flex flex-col items-center justify-between p-1.5 shadow-lg ${className}`}
    >
      <div className={`self-start text-xs font-bold leading-none ${color}`}>
        <div>{c.rank}</div>
        <div>{symbol}</div>
      </div>
      <div className={`text-2xl ${color}`}>{symbol}</div>
      <div className={`self-end text-xs font-bold leading-none rotate-180 ${color}`}>
        <div>{c.rank}</div>
        <div>{symbol}</div>
      </div>
    </div>
  );
}
