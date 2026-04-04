import type { SlotSymbol, SlotsTableConfig } from '../types/game.js';

export const SLOTS_DEFAULTS: SlotsTableConfig = {
  minBet: 10,
  maxBet: 5000,
  reelCount: 5,
  rowCount: 3,
};

/** Symbol weights for reel generation (higher = more frequent) */
export const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  cherry: 20,
  lemon: 18,
  orange: 16,
  plum: 14,
  bell: 10,
  bar: 7,
  seven: 4,
  diamond: 2,
};

/** Payout multipliers for 3, 4, or 5 matching symbols on a line */
export const SYMBOL_PAYOUTS: Record<SlotSymbol, { three: number; four: number; five: number }> = {
  cherry: { three: 2, four: 5, five: 10 },
  lemon: { three: 3, four: 8, five: 15 },
  orange: { three: 4, four: 10, five: 20 },
  plum: { three: 5, four: 15, five: 30 },
  bell: { three: 10, four: 30, five: 75 },
  bar: { three: 20, four: 60, five: 150 },
  seven: { three: 50, four: 150, five: 500 },
  diamond: { three: 100, four: 500, five: 2000 },
};

/** Display emojis for each symbol */
export const SYMBOL_DISPLAY: Record<SlotSymbol, string> = {
  cherry: '\uD83C\uDF52',
  lemon: '\uD83C\uDF4B',
  orange: '\uD83C\uDF4A',
  plum: '\uD83E\uDD6D',
  bell: '\uD83D\uDD14',
  bar: '\uD83C\uDF7A',
  seven: '7\uFE0F\u20E3',
  diamond: '\uD83D\uDC8E',
};

/**
 * Win lines (row indices per reel for 5 reels × 3 rows).
 * Row 0 = top, Row 1 = middle, Row 2 = bottom.
 */
export const WIN_LINES: number[][] = [
  [1, 1, 1, 1, 1], // line 0: middle row
  [0, 0, 0, 0, 0], // line 1: top row
  [2, 2, 2, 2, 2], // line 2: bottom row
  [0, 1, 2, 1, 0], // line 3: V shape
  [2, 1, 0, 1, 2], // line 4: inverted V
  [0, 0, 1, 2, 2], // line 5: diagonal down
  [2, 2, 1, 0, 0], // line 6: diagonal up
  [1, 0, 0, 0, 1], // line 7: top dip
  [1, 2, 2, 2, 1], // line 8: bottom dip
];

export const TOTAL_WIN_LINES = WIN_LINES.length;
