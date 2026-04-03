import type { Card } from '@casino/shared';
import { CardRank } from '@casino/shared';

export interface HandRank {
  rank: number;       // 1 (Royal Flush) – 10 (High Card)
  name: string;
  value: number;      // Numeric comparison value for tiebreaker
  cards: Card[];      // The best 5 cards
}

const RANK_ORDER: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

function rankValue(rank: string): number {
  return RANK_ORDER[rank] || 0;
}

function sortByRankDesc(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
}

/**
 * Generate all 5-card combinations from a set of cards.
 */
function combinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length < k) return [];
  const [first, ...rest] = cards;
  const withFirst = combinations(rest, k - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function isFlush(cards: Card[]): boolean {
  return cards.every((c) => c.suit === cards[0].suit);
}

function isStraight(cards: Card[]): { straight: boolean; highCard: number } {
  const sorted = sortByRankDesc(cards);
  const values = sorted.map((c) => rankValue(c.rank));

  // Check normal straight
  let isSeq = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] - values[i] !== 1) {
      isSeq = false;
      break;
    }
  }
  if (isSeq) return { straight: true, highCard: values[0] };

  // Check wheel (A-2-3-4-5)
  if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    return { straight: true, highCard: 5 }; // 5-high straight
  }

  return { straight: false, highCard: 0 };
}

function getRankCounts(cards: Card[]): Map<number, Card[]> {
  const counts = new Map<number, Card[]>();
  for (const card of cards) {
    const v = rankValue(card.rank);
    if (!counts.has(v)) counts.set(v, []);
    counts.get(v)!.push(card);
  }
  return counts;
}

/**
 * Encode a hand value for comparison.
 * Higher = better. Uses a base-15 positional system.
 */
function encodeValue(...kickers: number[]): number {
  let val = 0;
  for (let i = 0; i < kickers.length; i++) {
    val = val * 15 + kickers[i];
  }
  return val;
}

function evaluateFive(cards: Card[]): HandRank {
  const flush = isFlush(cards);
  const { straight, highCard: straightHigh } = isStraight(cards);
  const rankCounts = getRankCounts(cards);

  // Group by count
  const groups: { count: number; rank: number; cards: Card[] }[] = [];
  for (const [rank, groupCards] of rankCounts) {
    groups.push({ count: groupCards.length, rank, cards: groupCards });
  }
  // Sort: by count desc, then by rank desc
  groups.sort((a, b) => b.count - a.count || b.rank - a.rank);

  const sorted = sortByRankDesc(cards);

  // Royal Flush
  if (flush && straight && straightHigh === 14) {
    return {
      rank: 1,
      name: 'Royal Flush',
      value: encodeValue(1, 14),
      cards: sorted,
    };
  }

  // Straight Flush
  if (flush && straight) {
    return {
      rank: 2,
      name: 'Straight Flush',
      value: encodeValue(2, straightHigh),
      cards: sorted,
    };
  }

  // Four of a Kind
  if (groups[0].count === 4) {
    const kicker = groups[1].rank;
    return {
      rank: 3,
      name: 'Four of a Kind',
      value: encodeValue(3, groups[0].rank, kicker),
      cards: sorted,
    };
  }

  // Full House
  if (groups[0].count === 3 && groups[1].count === 2) {
    return {
      rank: 4,
      name: 'Full House',
      value: encodeValue(4, groups[0].rank, groups[1].rank),
      cards: sorted,
    };
  }

  // Flush
  if (flush) {
    const vals = sorted.map((c) => rankValue(c.rank));
    return {
      rank: 5,
      name: 'Flush',
      value: encodeValue(5, ...vals),
      cards: sorted,
    };
  }

  // Straight
  if (straight) {
    return {
      rank: 6,
      name: 'Straight',
      value: encodeValue(6, straightHigh),
      cards: sorted,
    };
  }

  // Three of a Kind
  if (groups[0].count === 3) {
    const kickers = groups
      .slice(1)
      .map((g) => g.rank)
      .sort((a, b) => b - a);
    return {
      rank: 7,
      name: 'Three of a Kind',
      value: encodeValue(7, groups[0].rank, ...kickers),
      cards: sorted,
    };
  }

  // Two Pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const highPair = Math.max(groups[0].rank, groups[1].rank);
    const lowPair = Math.min(groups[0].rank, groups[1].rank);
    const kicker = groups[2].rank;
    return {
      rank: 8,
      name: 'Two Pair',
      value: encodeValue(8, highPair, lowPair, kicker),
      cards: sorted,
    };
  }

  // One Pair
  if (groups[0].count === 2) {
    const kickers = groups
      .slice(1)
      .map((g) => g.rank)
      .sort((a, b) => b - a);
    return {
      rank: 9,
      name: 'One Pair',
      value: encodeValue(9, groups[0].rank, ...kickers),
      cards: sorted,
    };
  }

  // High Card
  const vals = sorted.map((c) => rankValue(c.rank));
  return {
    rank: 10,
    name: 'High Card',
    value: encodeValue(10, ...vals),
    cards: sorted,
  };
}

/**
 * Evaluate the best 5-card hand from 7 cards (5 community + 2 hole).
 */
export function getBestFive(sevenCards: Card[]): HandRank {
  const combos = combinations(sevenCards, 5);
  let best: HandRank | null = null;

  for (const combo of combos) {
    const result = evaluateFive(combo);
    if (!best || compareHands(result, best) > 0) {
      best = result;
    }
  }

  return best!;
}

/**
 * Compare two hand ranks. Returns positive if a > b, negative if a < b, 0 if equal.
 * Lower rank number = better hand. If same rank, higher value = better.
 */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.rank !== b.rank) return b.rank - a.rank; // lower rank = better
  return a.value - b.value; // higher value = better
}
