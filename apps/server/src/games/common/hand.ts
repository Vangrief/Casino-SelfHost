import type { Card } from '@casino/shared';
import { BLACKJACK_CARD_VALUES } from '@casino/shared';

export function getHandValues(cards: Card[]): number[] {
  let values = [0];

  for (const card of cards) {
    const cardValues = BLACKJACK_CARD_VALUES[card.rank];
    if (!cardValues) continue;

    if (cardValues.length === 1) {
      values = values.map((v) => v + cardValues[0]);
    } else {
      // Ace: fork into both possibilities
      const newValues: number[] = [];
      for (const v of values) {
        for (const cv of cardValues) {
          newValues.push(v + cv);
        }
      }
      values = newValues;
    }
  }

  // Deduplicate
  return [...new Set(values)].sort((a, b) => a - b);
}

export function getBestHandValue(cards: Card[]): number {
  const values = getHandValues(cards);
  // Prefer highest value that's <= 21
  const valid = values.filter((v) => v <= 21);
  if (valid.length > 0) return Math.max(...valid);
  // All busted — return lowest
  return Math.min(...values);
}

export function isBusted(cards: Card[]): boolean {
  return getBestHandValue(cards) > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && getBestHandValue(cards) === 21;
}

export function isSoft(cards: Card[]): boolean {
  // A hand is soft if it has an Ace counted as 11
  const values = getHandValues(cards);
  const best = getBestHandValue(cards);
  // If best <= 21 and there exists a value = best - 10, then an Ace is counted as 11
  return best <= 21 && values.some((v) => v === best - 10);
}
