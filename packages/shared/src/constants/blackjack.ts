import type { BlackjackTableConfig } from '../types/game.js';

export const BLACKJACK_DEFAULTS: BlackjackTableConfig = {
  minBet: 100,
  maxBet: 10000,
  deckCount: 6,
  dealerStandsSoft17: true,
  blackjackPays: 1.5, // 3:2
  allowSurrender: false,
  maxSplits: 3,
};

export const BLACKJACK_CARD_VALUES: Record<string, number[]> = {
  '2': [2],
  '3': [3],
  '4': [4],
  '5': [5],
  '6': [6],
  '7': [7],
  '8': [8],
  '9': [9],
  '10': [10],
  J: [10],
  Q: [10],
  K: [10],
  A: [1, 11],
};

export const RESHUFFLE_THRESHOLD = 0.75;
export const INSURANCE_PAYOUT = 2; // 2:1
